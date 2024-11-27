import type { JSX } from "../jsx.d.ts";
import type { Instance } from "./Instance.ts";
import { Node } from "./Node.ts";

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
  version: number;

  constructor(
    props: JSX.DeviceElementProps,
    childDevices?: Record<string, Device>,
    nodes?: Record<string, Node>,
  ) {
    this.id = props.id;
    this.name = props.name;
    this.childDevices = childDevices ?? {};
    this.nodes = nodes ?? {};
    this.version = Date.now();
  }

  addChild(child: Instance) {
    if (child instanceof Device) {
      this.childDevices[child.id] = child;
      child.setParent(this);
      return;
    }

    if (child instanceof Node) {
      this.nodes[child.id] = child;
      return;
    }

    throw new Error("Only devices and nodes can be added to a device");
  }

  setParent(parent: Device) {
    this.parentId = parent.id;
    this.rootId = parent.rootId ?? parent.id;
  }

  cloneWithProps(props: JSX.DeviceElementProps, keepChildren: boolean) {
    return new Device(
      props,
      keepChildren ? this.childDevices : {},
      keepChildren ? this.nodes : {},
    );
  }

  // JSON representation of the device description according to the homie convention
  toJSON() {
    return {
      homie: "5.0",
      version: this.version,
      name: this.name,
      type: this.type,
      root: this.rootId,
      parent: this.parentId,
      extensions: this.extensions,
      devices: Object.keys(this.childDevices),
      nodes: Object.fromEntries(
        Object.entries(this.nodes).map(([id, node]) => [
          id,
          node.toJSON(),
        ]),
      ),
    };
  }
}
