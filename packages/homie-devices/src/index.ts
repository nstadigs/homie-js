import type { DeviceDescription, DeviceState } from "homie-spec";
import { produceWithPatches, enablePatches, type Producer } from "immer";

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
  rootDevice: Device;
  parentDevice?: Device;
  configuration: DeviceConfig;
  version: string;
  values: Record<string, any> = {};
  #isRunning: boolean;

  constructor(id: string, description: DeviceConfig, parentDevice?: Device) {
    this.id = id;
    this.version = Date.now().toString();
    this.configuration = description;
    this.parentDevice = parentDevice;
    this.rootDevice = this.parentDevice?.rootDevice ?? this;
    this.#isRunning = false;
  }

  get description(): DeviceDescription {
    return {
      ...this.configuration,
      version: this.version,
      homie: "5.0",
      root: this.rootDevice === this ? undefined : this.rootDevice.id,
      parent: this.parentDevice?.id,
    };
  }

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
          let propertyIds = propertyId ? [propertyId] : Object.keys(value);

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

  // createDevice(id: string, config: DeviceConfig) {
  //   const device = new Device(id, config, this.rootDevice, this.parentDevice);
  //   this.children.add(device);

  //   this.update((config) => {
  //     config.children.push(id);
  //   });

  //   return device;
  // }

  async start() {
    this.#isRunning = true;

    await this.publish("$state", "init");

    await Promise.allSettled([
      ...[...this.children].map((child) => child.start()),
      this.subscribe(`${this.id}/+/+/set`),
    ]);

    await this.publish("$description", JSON.stringify(this.description));
    await this.publish("$state", "ready");
  }

  publish(property: string, payload: string): Promise<void> {
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
