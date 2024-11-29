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

export type PropertyElementProps = Property & {
  id: string;
  value?: unknown;
  onSet?: (value: unknown) => void;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      device$: DeviceElementProps;
      node$: NodeElementProps;
      property$: PropertyElementProps;
    }
  }
}
