import type { PropertyElementProps } from "../jsx-runtime.ts";
import type { Instance } from "./Instance.ts";
import type { Node } from "./Node.ts";

export class Property implements Instance {
  readonly instanceType = "property" as const;

  readonly id: string;
  readonly datatype: string;
  readonly name?: string;
  readonly format?: string;
  readonly retained?: boolean;

  path?: string;

  transferable: {
    // deno-lint-ignore no-explicit-any
    onSet?: (value: any) => void;
    value?: unknown;
    target?: unknown;
  } = {};

  get onSet() {
    return this.transferable.onSet;
  }

  constructor(props: PropertyElementProps) {
    this.id = props.id;
    this.name = props.name ?? this.id;
    this.datatype = props.datatype;
    this.format = props.format;
    this.retained = props.retained;

    this.transferable.onSet = this.transferable.onSet ?? props.onSet;
    this.transferable.value = this.transferable.value ?? props.value;
    this.transferable.target = this.transferable.target ?? props.target;
  }

  addChild() {
    throw new Error("Properties cannot have children");
  }

  setParent(node: Node) {
    this.path = `${node.deviceId}/${node.id}/${this.id}`;
  }

  cloneWithProps(props: PropertyElementProps) {
    let nextInstance: Property;

    if (
      props.id !== this.id || props.datatype !== this.datatype ||
      props.format !== this.format || props.retained !== this.retained
    ) {
      nextInstance = new Property(props);
    } else {
      nextInstance = this;
    }

    nextInstance.transferable = this.transferable;
    return nextInstance;
  }

  toJSON() {
    return {
      name: this.name,
      datatype: this.datatype,
      format: this.format,
      retained: this.retained,
      settable: this.transferable.onSet !== undefined,
    };
  }
}
