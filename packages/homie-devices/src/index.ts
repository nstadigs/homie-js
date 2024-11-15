import type { DeviceDescription, DeviceState } from "@nstadigs/homie-spec";
import { produceWithPatches, enablePatches, type Producer } from "immer";
import fnv1a from "@sindresorhus/fnv1a";

enablePatches();

export type OnMessageCallback = (topic: string, payload: string) => void;

export type MqttAdapter = {
  connect(url: string): Promise<void>;
  disconnect(url: string): Promise<void>;
  subscribe(topic: string): Promise<void>;
  unsubscribe(topic: string): Promise<void>;
  publish(topic: string, payload: string): Promise<void>;
  onMessage(callback: OnMessageCallback): VoidFunction;

  // For last will messages
  onBeforeDisconnect(callback: () => void): void;
};

export type DeviceConfig = Omit<DeviceDescription, "version" | "homie">;

class Device {
  id: string;
  children: Set<Device> = new Set();
  state: DeviceState = "init";
  log: string | null = null;
  readonly rootDevice: Device;
  readonly parentDevice?: Device;
  configuration: DeviceConfig;
  version: string;
  values: Record<string, any> = {};

  constructor(id: string, description: DeviceConfig, parentDevice?: Device) {
    this.id = id;
    this.version = Date.now().toString();
    this.configuration = description;
    this.parentDevice = parentDevice;
    this.rootDevice = this.parentDevice?.rootDevice ?? this;
  }

  get description() {
    return this.createDescription(this.children, this.configuration);
  }

  createDescription = memoize(
    (children: Set<Device>, configuration: DeviceConfig) => {
      return {
        ...configuration,
        version: this.version,
        homie: "5.0",
        root: this.rootDevice === this ? undefined : this.rootDevice.id,
        parent: this.parentDevice?.id,
        children: [...children].map(({ id }) => id),
      };
    }
  );

  async update(update: Producer<DeviceDescription>) {
    const [nextConfiguration, patches] = produceWithPatches(
      this.configuration,
      update
    );

    if (patches.length === 0) {
      return;
    }

    this.configuration = nextConfiguration;
    await this.rootDevice.publish("$state", "init");

    const nodeUpdateRequests = patches.flatMap(({ op, path, value }) => {
      const [, nodeId, , propertyId] = path;

      switch (op) {
        case "remove": {
          const propertyIds = propertyId ? [propertyId] : Object.keys(value);

          return propertyIds.flatMap((propertyId) => [
            this.publish(`$nodes/${nodeId}/${propertyId}`, ""),
            this.publish(`$nodes/${nodeId}/${propertyId}/$target`, ""),
          ]);
        }

        case "replace": {
        }
      }
    });

    const description = this.description;
    const descriptionAsJson = JSON.stringify(description);

    await Promise.allSettled(nodeUpdateRequests);
    await this.rootDevice.publish("$description", descriptionAsJson);
    await this.rootDevice.publish("$state", "ready");
  }

  createDevice(id: string, config: DeviceConfig) {
    const device = new Device(id, config, this.parentDevice);
    this.children.add(device);

    return device;
  }

  async start() {
    await this.publish("$state", "init");

    await Promise.allSettled([
      ...[...this.children].map((child) => child.start()),
      this.subscribe(`${this.id}/+/+/set`),
    ]);

    await this.publish("$description", JSON.stringify(this.description));
    await this.publish("$state", "ready");
  }

  publish(property: string, payload: string): Promise<void> {
    const description = this.description;

    return this.rootDevice.publish(`${this.id}/${property}`, payload);
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

  override publish(subTopic: string, payload: string): Promise<void> {
    return this.mqttAdapter.publish(`homie/5/${subTopic}`, payload);
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
