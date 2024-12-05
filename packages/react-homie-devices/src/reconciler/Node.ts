import type { MqttAdapter } from "@nstadigs/homie-adapter";
import type { NodeElementProps } from "../jsx-runtime.ts";
import type { Device } from "./Device.ts";
import type { Instance } from "./Instance.ts";
import { Property } from "./Property.ts";

export class Node implements Instance {
  instanceType = "node" as const;

  id: string;
  name?: string;
  type?: string;
  deviceId?: string;
  properties: Record<string, Property>;
  mqtt?: MqttAdapter;

  constructor(
    props: NodeElementProps,
    properties?: Record<string, Property>,
  ) {
    this.id = props.id;
    this.name = props.name ?? this.id;
    this.type = props.type;
    this.properties = properties ?? {};
  }

  addChild(child: Instance) {
    if (!(child instanceof Property)) {
      throw new Error("Only properties can be added to a node");
    }

    this.properties[child.id] = child;
  }

  commitMount() {
    // noop
  }

  setParent(device: Device) {
    this.deviceId = device.id;

    Object.values(this.properties).forEach((property) =>
      property.setParent(this)
    );
  }

  recursivelySetMqtt(mqtt: MqttAdapter) {
    this.mqtt = mqtt;

    Object.values(this.properties).forEach((child) => child.setMqtt(mqtt));
  }

  prepareUpdate(oldProps: unknown, newProps: unknown): null | Array<unknown> {
    return null;
  }

  commitUpdate(updatePayload: unknown[]): void {
  }

  toJSON() {
    const propertyEntries = Object.entries(this.properties).map(
      ([id, property]) => [id, property.toJSON()],
    );

    return {
      name: this.name,
      type: this.type,
      properties: propertyEntries.length > 0
        ? Object.fromEntries(
          propertyEntries,
        )
        : undefined,
    };
  }
}
