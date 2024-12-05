import type { MqttAdapter } from "@nstadigs/homie-adapter";
import type { DeviceElementProps } from "../jsx-runtime.ts";
import type { Instance } from "./Instance.ts";
import { Node } from "./Node.ts";
import fnv1a from "fnv1a";
import { assert } from "@std/assert/assert";
import { validateValue } from "@nstadigs/homie-spec";

export class Device implements Instance {
  instanceType = "device" as const;

  id: string;
  type?: "string";
  name?: string;
  extensions?: string[];

  childDevices: Record<string, Device>;
  nodes: Record<string, Node>;
  parentId?: string;
  rootId?: string;
  mqtt?: MqttAdapter;

  constructor(
    props: DeviceElementProps,
    childDevices?: Record<string, Device>,
    nodes?: Record<string, Node>,
  ) {
    this.id = props.id;
    this.name = props.name ?? this.id;
    this.childDevices = childDevices ?? {};
    this.nodes = nodes ?? {};
  }

  get version(): number {
    const obj = {
      name: this.name,
      type: this.type,
      rootId: this.rootId,
      parentId: this.parentId,
      extensions: this.extensions,
      children: Object.keys(this.childDevices).sort(),
      nodes: this.nodes,
    };

    return Number(fnv1a(JSON.stringify(obj), { size: 32 }));
  }

  addChild(child: Instance) {
    assert(
      child instanceof Device || child instanceof Node,
      "Only devices and nodes can be added to a device",
    );

    if (child instanceof Device) {
      this.childDevices[child.id] = child;
      child._recursivelySetParent(this);
      return;
    }

    this.nodes[child.id] = child;
    child.setParent(this);
    return;
  }

  // Parent device isn't added to its parent yet.
  // We need to propagate rootId and mqtt down the tree from the root device
  _recursivelySetParent(parent: Device) {
    this.parentId = parent.id;
    this.rootId = parent.rootId ?? parent.id;

    Object.values(this.childDevices).forEach((child) =>
      child._recursivelySetParent(this)
    );
  }

  recursivelySetMqtt(mqtt: MqttAdapter) {
    this.mqtt = mqtt;

    Object.values(this.childDevices).forEach((childDevice) =>
      childDevice.recursivelySetMqtt(mqtt)
    );

    Object.values(this.nodes).forEach((node) => node.recursivelySetMqtt(mqtt));
  }

  commitMount() {
    this.mqtt?.publish("$state", "init", 2, true);
    this.mqtt?.publish(
      `homie/5/${this.id}/$description`,
      JSON.stringify(this),
      2,
      true,
    );
    this.mqtt?.publish("$state", "ready", 2, true);
    this.mqtt?.subscribe(`+/5/${this.id}/+/+/set`);

    this.mqtt?.onMessage((topic, payload) => {
      const [, , deviceId, nodeId, propertyId, setLiteral] = topic.split("/");

      if (deviceId !== this.id || setLiteral !== "set") {
        return;
      }

      const node = this.nodes[nodeId];
      const property = node?.properties[propertyId];

      if (!property || typeof property.onSet !== "function") {
        // TODO: Consider logging when trying to set a non-existing property
        return;
      }

      const { datatype, format } = property;
      const validatedPayload = validateValue({ datatype, format }, payload);

      if (!validatedPayload.valid) {
        // TODO: Consider logging when trying to setting an invalid value
        return;
      }

      property.onSet(validatedPayload.value);
    });
  }

  prepareUpdate(
    oldProps: Record<string, unknown>,
    newProps: Record<string, unknown>,
  ): null | Array<unknown> {
    const allKeys = new Set([
      ...Object.keys(oldProps),
      ...Object.keys(newProps),
    ]);
    const updates = [];

    for (const key of allKeys) {
      if (oldProps[key] !== newProps[key]) {
        updates.push([key, newProps[key]]);
      }
    }

    return updates[0] == null ? null : updates;
  }

  commitUpdate(updatePayload: [key: string, value: unknown][]): void {
    const valuesToUpdate = [
      "id",
      "type",
      "name",
      "extensions",
      "childDevices",
    ];

    let shouldPublish = false;

    for (const [key, value] of updatePayload) {
      if (valuesToUpdate.includes(key)) {
        shouldPublish = true;
        (this as Record<string, unknown>)[key] = value;
      }
    }

    if (shouldPublish) {
      this.mqtt?.publish(`homie/5/${this.id}/$state`, "init", 2, true);
      this.mqtt?.publish(
        `homie/5/${this.id}/$description`,
        JSON.stringify(this),
        2,
        true,
      );
      this.mqtt?.publish(`homie/5/${this.id}/$state`, "ready", 2, true);
    }
  }

  // JSON representation of the device description according to the homie convention
  toJSON() {
    const nodeEntries = Object.entries(this.nodes).map(([id, node]) => [
      id,
      node.toJSON(),
    ]);

    return {
      homie: "5.0",
      version: this.version,
      name: this.name,
      type: this.type,
      root: this.rootId,
      parent: this.parentId,
      extensions: this.extensions,
      children: Object.keys(this.childDevices),
      nodes: Object.fromEntries(nodeEntries),
    };
  }
}
