import type { DeviceDescription, DeviceState } from "jsr:@nstadigs/homie-spec";
import { enablePatches, type Producer, produceWithPatches } from "immer";
import fnv1a from "fnv1a";
import type { MqttAdapter } from "./MqttAdapter.ts";

enablePatches();

export type SetCommandCallback = (props: {
  propertyId: string;
  nodeId: string;
  value: string;
  raw: string;
}) => void;

export type DeviceConfig = Omit<DeviceDescription, "version" | "homie">;

class Device {
  id: string;
  children: Set<Device> = new Set();
  state: DeviceState = "disconnected";
  log: string | null = null;
  readonly rootDevice: RootDevice;
  readonly parentDevice?: Device;
  configuration: DeviceConfig;
  values: Record<string, unknown> = {};
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

    await this.publish("$state", state);
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
        this.publish(`${nodeId}/${propertyId}`, ""),
        this.publish(`${nodeId}/${propertyId}/$target`, ""),
      ]);
    });

    this.configuration = nextConfiguration;
    const description = this.description;
    const descriptionAsJson = JSON.stringify(description);

    await Promise.allSettled(topicRemovalRequests);
    await this.rootDevice.publish("$description", descriptionAsJson);
    await this.setState("ready");
  }

  async createDevice(id: string, config: DeviceConfig) {
    this.setState("init");

    const device = new Device(id, config, this);

    // await this.

    await device.start();
    // Create new set to avoid referential equality
    this.children = new Set(this.children).add(device);
    this.publish("$description", JSON.stringify(this.description));
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
      this.subscribe(`${this.id}/+/+/set`),
    ]);

    await this.publish("$description", JSON.stringify(this.description));
    await this.setState("ready");
  }

  publish(subTopic: string, payload: string): Promise<void> {
    return this.rootDevice.mqttAdapter.publish(
      `homie/5/${this.id}/${subTopic}`,
      payload,
      2,
      true,
    );
  }

  #handleMessage = (topic: string, payload: string) => {
    if (this.#onMessageCallbacks.size === 0) {
      return;
    }

    const commandTopicMatcher = new RegExp(
      `^homie\/5\/${this.id}\/(?<propertyId>[a-z\d-]+)\/(?<nodeId>[a-z\d-]+)\/set$`,
    );

    const match = commandTopicMatcher.exec(topic);

    if (match == null) {
      return;
    }

    const { propertyId, nodeId } = match.groups as {
      propertyId: string;
      nodeId: string;
    };

    const value = "";
    const raw = payload;

    [...this.#onMessageCallbacks].forEach((callback) => {
      callback({ propertyId, nodeId, value, raw });
    });
  };

  onCommand(callback: (topic: string, payload: string) => VoidFunction) {
    return this.rootDevice.mqttAdapter.onMessage((topic, payload) => {
      const commandTopicMatcher = new RegExp(
        `^homie\/5\/${this.id}\/(?<property>[a-z\d-]+)\/(?<node>[a-z\d-]+)\/set$`,
      );

      const match = commandTopicMatcher.exec(topic);

      if (match != null) {
        callback(this.id, payload);
      }
    });
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

function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
): (...args: TArgs) => TReturn {
  let lastArgs: TArgs | [] = [];
  let lastResult: TReturn;

  return (...args: TArgs) => {
    if (
      lastArgs &&
      lastArgs.length === args.length &&
      args.every((arg, i) => arg === lastArgs[i])
    ) {
      return lastResult;
    }

    lastResult = fn(...args);
    lastArgs = args;

    return lastResult;
  };
}
