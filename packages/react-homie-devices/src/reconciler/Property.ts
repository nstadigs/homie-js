import type { PropertyElementProps } from "../jsx-runtime.ts";
import type { Instance } from "./Instance.ts";
import type { Node } from "./Node.ts";

export class Property implements Instance {
  instanceType = "property" as const;

  id: string;
  datatype: string;
  name?: string;
  format?: string;
  retained?: boolean;
  path?: string;

  onSet?: PropertyElementProps["onSet"];

  constructor(props: PropertyElementProps) {
    this.id = props.id;
    this.name = props.name ?? this.id;
    this.datatype = props.datatype;
    this.format = props.format;
    this.retained = props.retained;
    this.onSet = props.onSet;
  }

  addChild() {
    throw new Error("Properties cannot have children");
  }

  setParent(node: Node) {
    this.path = `${node.deviceId}/${node.id}/${this.id}`;
  }

  cloneWithProps(props: PropertyElementProps) {
    return new Property(props);
  }

  toJSON() {
    return {
      name: this.name,
      datatype: this.datatype,
      format: this.format,
      retained: this.retained,
      settable: this.onSet !== undefined,
    };
  }
}
