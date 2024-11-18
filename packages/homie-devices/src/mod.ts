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
  state: DeviceState = "init";
  log: string | null = null;
  readonly rootDevice: RootDevice;
  readonly parentDevice?: Device;
  configuration: DeviceConfig;
  values: Record<string, any> = {};
  publishedDescription: DeviceDescription | null = null;
  #onMessageCallbacks: Set<SetCommandCallback> = new Set();

  constructor(id: string, config: DeviceConfig, parentDevice?: Device) {
    this.id = id;
    this.configuration = config;
    this.parentDevice = parentDevice;
    this.rootDevice =
      this.parentDevice?.rootDevice ?? (this as unknown as RootDevice);
  }

  get description() {
    return this.createDescription(this.children, this.configuration);
  }

  createDescription = memoize(
    (children: Set<Device>, configuration: DeviceConfig): DeviceDescription => {
      let description = {
        ...configuration,
        nodes: configuration.nodes ?? {},
        homie: "5.0",
        version: "",
        root:
          this.rootDevice === (this as unknown as RootDevice)
            ? undefined
            : this.rootDevice.id,
        parent: this.parentDevice?.id,
        children: [...children].map(({ id }) => id),
      } satisfies DeviceDescription;

      description.version = fnv1a(JSON.stringify(description)).toString(16);

      return description;
    }
  );

  async reconfigure(update: Producer<DeviceDescription>) {
    const [nextConfiguration, patches] = produceWithPatches(
      this.configuration,
      update
    );

    if (patches.length === 0) {
      return;
    }

    await this.rootDevice.publish("$state", "init");

    const topicRemovalRequests = patches.flatMap(({ op, path, value }) => {
      const [, nodeId, , propertyId] = path;

      if (op === "add") {
        return [];
      }

      switch (op) {
        case "remove": {
          const propertyIds = propertyId
            ? [propertyId]
            : Object.keys(this.configuration?.nodes?.[nodeId].properties ?? {});

          return propertyIds.flatMap((propertyId) => [
            this.publish(`${nodeId}/${propertyId}`, ""),
            this.publish(`${nodeId}/${propertyId}/$target`, ""),
          ]);
        }

        case "replace": {
        }
      }
    });

    this.configuration = nextConfiguration;
    const description = this.description;
    const descriptionAsJson = JSON.stringify(description);

    await Promise.allSettled(topicRemovalRequests);
    await this.rootDevice.publish("$description", descriptionAsJson);
    await this.rootDevice.publish("$state", "ready");
  }

  createDevice(id: string, config: DeviceConfig) {
    const device = new Device(id, config, this.parentDevice);

    // Create new set to avoid referential equality
    this.children = new Set(this.children).add(device);
    const description = this.description;

    return device;
  }

  async start() {
    await this.publish("$state", "init");

    // TODO: Store unsubscribe function returned from onMessage
    // and call it on destroy
    this.rootDevice.mqttAdapter.onMessage(this.#handleMessage);

    await Promise.allSettled([
      ...[...this.children].map((child) => child.start()),
      this.subscribe(`${this.id}/+/+/set`),
    ]);

    await this.publish("$description", JSON.stringify(this.description));
    await this.publish("$state", "ready");
  }

  async publish(subTopic: string, payload: string): Promise<void> {
    return this.rootDevice.mqttAdapter.publish(
      `homie/5/${this.id}/${subTopic}`,
      payload,
      2,
      true
    );
  }

  #handleMessage = (topic: string, payload: string) => {
    if (this.#onMessageCallbacks.size === 0) {
      return;
    }

    const commandTopicMatcher = new RegExp(
      `^homie\/5\/${this.id}\/(?<propertyId>[a-z\d-]+)\/(?<nodeId>[a-z\d-]+)\/set$`
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
        `^homie\/5\/${this.id}\/(?<property>[a-z\d-]+)\/(?<node>[a-z\d-]+)\/set$`
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
export { type DeviceType as Device };

export class RootDevice extends Device {
  readonly mqttAdapter: MqttAdapter;

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

export function createRootDevice(
  id: string,
  description: DeviceConfig,
  mqttAdapter: MqttAdapter
) {
  return new RootDevice(id, description, mqttAdapter);
}

function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn
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