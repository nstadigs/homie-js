import type { Property } from "@nstadigs/homie-spec";

// TODO: We can probably create some simple runtime instead of
// importing from react.

// EDIT: Maybe take from this:
// https://github.com/adrian-afl/render-jsx-reupload/blob/main/src/rendering.ts
export { Fragment, jsx, jsxs } from "react/jsx-runtime";

export type DeviceElementProps = {
  id: string;
  children?: React.ReactNode;
  name?: string;
  type?: string;
};

export type NodeElementProps = {
  id: string;
  children?: React.ReactNode;
  name?: string;
  type?: string;
};

type PropertyElementPropsBase = Property & {
  id: string;
  value?: unknown;
  datatype: Property["datatype"];
};

type StringPropertyElementProps = PropertyElementPropsBase & {
  datatype: "string";
  value?: string;
  onSet?: (value: string) => void;
};

export type IntegerPropertyElementProps = PropertyElementPropsBase & {
  datatype: "integer";
  value?: number;
  onSet?: (value: number) => void;
};

export type FloatPropertyElementProps = PropertyElementPropsBase & {
  datatype: "float";
  value?: number;
  onSet?: (value: number) => void;
};

export type BooleanPropertyElementProps = PropertyElementPropsBase & {
  datatype: "boolean";
  value?: boolean;
  onSet?: (value: boolean) => void;
};

type EnumPropertyElementProps = PropertyElementPropsBase & {
  datatype: "enum";
  value?: string;
  onSet?: (value: string) => void;
};

type ColorPropertyElementProps = PropertyElementPropsBase & {
  datatype: "color";
  value?: string;
  onSet?: (value: string) => void;
};

export type PropertyElementProps =
  | StringPropertyElementProps
  | IntegerPropertyElementProps
  | FloatPropertyElementProps
  | BooleanPropertyElementProps
  | EnumPropertyElementProps
  | ColorPropertyElementProps;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      device$: DeviceElementProps;
      node$: NodeElementProps;
      property$: PropertyElementProps;
    }
  }
}
