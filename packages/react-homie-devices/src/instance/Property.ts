import type { PropertyElementProps } from "../jsx-runtime.ts";
import type { Instance } from "./Instance.ts";

export class Property implements Instance {
  instanceType = "property" as const;

  id: string;
  datatype: string;
  name?: string;
  format?: string;
  retained?: boolean;
  settable?: boolean;

  constructor(props: PropertyElementProps) {
    this.id = props.id;
    this.name = props.name;
    this.datatype = props.datatype;
    this.format = props.format;
    this.retained = props.retained;
    this.settable = props.settable;
  }

  addChild() {
    throw new Error("Properties cannot have children");
  }

  cloneWithProps(props: PropertyElementProps) {
    return new Property(props);
  }

  toJSON() {
    return {};
  }
}
