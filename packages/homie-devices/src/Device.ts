import {
  type DeviceDescription,
  type DeviceState,
  validateValue,
} from "jsr:@nstadigs/homie-spec";
import { enablePatches, type Producer, produceWithPatches } from "immer";
import fnv1a from "fnv1a";
import type { MqttAdapter } from "./MqttAdapter.ts";
import { memoize } from "./lib/memoize.ts";

enablePatches();

export type SetCommandCallback = (props: {
  propertyId: string;
  nodeId: string;
  value: unknown;
  raw: string;
}) => void;

export type DeviceConfig = Omit<DeviceDescription, "version" | "homie">;

class Device {
  id: string;
  children: Set<Device> = new Set();
  state: DeviceState = "disconnected";
  readonly rootDevice: RootDevice;
  readonly parentDevice?: Device;
  configuration: DeviceConfig;
  valueCache: Record<string, Record<string, unknown>> = {};
  publishedDescription: DeviceDescription | null = null;
  #onMessageCallbacks: Set<SetCommandCallback> = new Set();

  constructor(id: string, config: DeviceConfig, parentDevice?: Device) {
    this.id = id;
    this.configuration = config;
    this.parentDevice = parentDevice;
    this.rootDevice = this.parentDevice?.rootDevice ??
      (this as unknown as RootDevice);
  }

  get description() {
    return this.#createDescription(this.children, this.configuration);
  }

  async setState(state: DeviceState) {
    if (this.state === state) {
      return;
    }

    this.state = state;

    await this.#publish("$state", state);
  }

  #createDescription = memoize(
    (children: Set<Device>, configuration: DeviceConfig): DeviceDescription => {
      const description = {
        ...configuration,
        nodes: configuration.nodes ?? {},
        homie: "5.0",
        version: 0,
        root: this.rootDevice === (this as unknown as RootDevice)
          ? undefined
          : this.rootDevice.id,
        parent: this.parentDevice?.id,
        children: [...children].map(({ id }) => id),
      } satisfies DeviceDescription;

      description.version = Number(fnv1a(JSON.stringify(description), {
        size: 32,
      }));

      return description;
    },
  );

  async reconfigure(update: Producer<DeviceDescription>) {
    const [nextConfiguration, patches] = produceWithPatches(
      this.configuration,
      update,
    );

    if (patches.length === 0) {
      return;
    }

    await this.setState("init");

    const topicRemovalRequests = patches.flatMap(({ op, path }) => {
      const [propertyName, nodeId, , propertyId] = path;

      if ((op === "add") || (propertyName !== "nodes")) {
        return;
      }

      const propertyIds = propertyId
        ? [propertyId]
        : Object.keys(this.configuration?.nodes?.[nodeId].properties ?? {});

      return propertyIds.flatMap((propertyId) => [
        this.#publish(`${nodeId}/${propertyId}`, ""),
        this.#publish(`${nodeId}/${propertyId}/$target`, ""),
      ]);
    });

    this.configuration = nextConfiguration;
    const description = this.description;
    const descriptionAsJson = JSON.stringify(description);

    await Promise.allSettled(topicRemovalRequests);
    await this.rootDevice.#publish("$description", descriptionAsJson);
    await this.setState("ready");
  }

  async createDevice(id: string, config: DeviceConfig) {
    this.setState("init");

    const device = new Device(id, config, this);

    // await this.

    await device.start();
    // Create new set to avoid referential equality
    this.children = new Set(this.children).add(device);
    this.#publish("$description", JSON.stringify(this.description));
    this.setState("ready");

    return device;
  }

  async start() {
    await this.setState("init");

    // TODO: Store unsubscribe function returned from onMessage
    // and call it on destroy
    this.rootDevice.mqttAdapter.onMessage(this.#handleMessage);

    await Promise.allSettled([
      ...[...this.children].map((child) => child.start()),
      this.subscribe(`homie/5/${this.id}/+/+/set`),
    ]);

    await this.#publish("$description", JSON.stringify(this.description));
    await this.setState("ready");
  }

  #log(level: "debug" | "info" | "warn" | "error" | "fatal", message: string) {
    this.#publish(`$log/${level}`, message, 0, false);
  }

  #publish(
    subTopic: string,
    payload: string,
    qos: 0 | 1 | 2 = 2,
    retain: boolean = true,
  ): Promise<void> {
    return this.rootDevice.mqttAdapter.publish(
      `homie/5/${this.id}/${subTopic}`,
      payload,
      qos,
      retain,
    );
  }

  #handleMessage = (topic: string, payload: string) => {
    if (this.#onMessageCallbacks.size === 0) {
      return;
    }

    const commandTopicMatcher = new RegExp(
      `^homie\/5\/${this.id}\/(?<nodeId>[a-z\\d-]+)\/(?<propertyId>[a-z\\d-]+)\/set$`,
    );

    const match = commandTopicMatcher.exec(topic);

    if (match == null) {
      return;
    }

    const { propertyId, nodeId } = match.groups as {
      propertyId: string;
      nodeId: string;
    };

    const property = this.configuration.nodes?.[nodeId]?.properties[propertyId];

    if (!property) {
      return;
    }

    const { datatype, format } = property;

    const raw = payload;
    const result = validateValue({ format, datatype }, payload);

    if (!result.valid) {
      // TODO: Log error
      return;
    }

    [...this.#onMessageCallbacks].forEach((callback) => {
      callback({ propertyId, nodeId, value: result.value as string, raw });
    });
  };

  onCommand(callback: SetCommandCallback): VoidFunction {
    this.#onMessageCallbacks.add(callback);

    return () => {
      this.#onMessageCallbacks.delete(callback);
    };
  }

  setValue(nodeId: string, propertyId: string, value: string) {
    const property = this.configuration.nodes?.[nodeId].properties[propertyId];

    if (property == null) {
      console.error(
        `${this.id}: Tried to set value ${value} for unexisting property ${nodeId}/${propertyId}.`,
      );

      return;
    }

    if (!validateValue(property, value).valid) {
      console.error(
        `${this.id}: Tried to set invalid value ${value} for ${nodeId}/${propertyId}.`,
      );

      return;
    }

    this.valueCache[nodeId] = this.valueCache[nodeId] ?? {};
    this.valueCache[nodeId][propertyId] = value;

    this.#publish(`${nodeId}/${propertyId}`, value);
  }

  subscribe(topic: string): Promise<void> {
    return this.rootDevice.subscribe(topic);
  }

  unsubscribe(topic: string): Promise<void> {
    return this.rootDevice.unsubscribe(topic);
  }
}

type DeviceType = InstanceType<typeof Device>;
export type { DeviceType as Device };

/**
 * Represents a root device.
 * The root device handles all mqtt communication of itself and child devices.
 */
export class RootDevice extends Device {
  readonly mqttAdapter: MqttAdapter;

  /**
   * Constructs a new instance of the Device class.
   *
   * @param id - The ID of the device.
   * @param description - The description of the device.
   * @param mqttAdapter - The MQTT adapter to use for this device and all child devices.
   */
  constructor(id: string, description: DeviceConfig, mqttAdapter: MqttAdapter) {
    super(id, description);

    this.mqttAdapter = mqttAdapter;
  }

  override subscribe(topic: string): Promise<void> {
    return this.mqttAdapter.subscribe(topic);
  }

  override unsubscribe(topic: string): Promise<void> {
    return this.mqttAdapter.unsubscribe(topic);
  }
}

/**
 * Creates a root device.
 *
 * @param id - The ID of the device.
 * @param description - The configuration of the device.
 * @param mqttAdapter - The MQTT adapter to use for this device and all child devices.
 * @returns The created root device.
 */
export function createRootDevice(
  id: string,
  description: DeviceConfig,
  mqttAdapter: MqttAdapter,
) {
  return new RootDevice(id, description, mqttAdapter);
}
