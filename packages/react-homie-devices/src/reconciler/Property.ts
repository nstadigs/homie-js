import type { PropertyElementProps } from "../jsx-runtime.ts";
import type { Instance } from "./Instance.ts";

export class Property implements Instance {
  instanceType = "property" as const;

  id: string;
  datatype: string;
  name?: string;
  format?: string;
  retained?: boolean;

  // This object is shared between all clones of an instance
  shared?: {
    onSet?: (value: unknown) => void;
  };

  constructor(props: PropertyElementProps, _shared?: typeof this.shared) {
    this.id = props.id;
    this.name = props.name ?? this.id;
    this.datatype = props.datatype;
    this.format = props.format;
    this.retained = props.retained;

    this.shared = _shared ?? {
      onSet: props.onSet,
    };
  }

  addChild() {
    throw new Error("Properties cannot have children");
  }

  cloneWithProps(props: PropertyElementProps) {
    return new Property(props, this.shared);
  }

  toJSON() {
    return {
      name: this.name,
      datatype: this.datatype,
      format: this.format,
      retained: this.retained,
      settable: this.shared?.onSet !== undefined,
    };
  }
}
