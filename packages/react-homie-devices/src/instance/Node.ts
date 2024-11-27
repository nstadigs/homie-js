import type { NodeElementProps } from "../jsx-runtime.ts";
import type { Instance } from "./Instance.ts";
import { Property } from "./Property.ts";

export class Node implements Instance {
  instanceType = "node" as const;

  id: string;
  name?: string;
  type?: string;
  properties: Record<string, Property>;

  constructor(
    props: NodeElementProps,
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

  cloneWithProps(props: NodeElementProps, keepChildren: boolean) {
    return new Node(props, keepChildren ? this.properties : {});
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
