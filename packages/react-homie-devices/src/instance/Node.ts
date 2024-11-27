import type { Instance } from "./Instance.ts";
import { Property } from "./Property.ts";
import type { JSX } from "../jsx.d.ts";

export class Node implements Instance {
  instanceType = "node" as const;

  id: string;
  name?: string;
  type?: string;
  properties: Record<string, Property>;

  constructor(
    props: JSX.NodeElementProps,
    properties?: Record<string, Property>,
  ) {
    this.id = props.id;
    this.name = props.name;
    this.type = props.type;
    this.properties = properties ?? {};
  }

  addChild(child: Instance) {
    if (!(child instanceof Property)) {
      throw new Error("Only properties can be added to a node");
    }

    this.properties[child.id] = child;
  }

  cloneWithProps(props: JSX.NodeElementProps, keepChildren: boolean) {
    return new Node(props, keepChildren ? this.properties : {});
  }

  toJSON() {
    return {
      properties: Object.fromEntries(
        Object.entries(this.properties).map(([id, property]) => [
          id,
          property.toJSON(),
        ]),
      ),
    };
  }
}
