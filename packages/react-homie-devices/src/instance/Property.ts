import type { Instance } from "./Instance.ts";
import type { JSX } from "../jsx.d.ts";

export class Property implements Instance {
  instanceType = "property" as const;

  id: string;
  datatype: string;
  name?: string;
  format?: string;
  retained?: boolean;
  settable?: boolean;

  constructor(props: JSX.PropertyElementProps) {
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

  cloneWithProps(props: JSX.PropertyElementProps) {
    return new Property(props);
  }

  toJSON() {
    return {};
  }
}
