import type { Property } from "@nstadigs/homie-spec";

// TODO: We can probably create some simple transform instead of
// importing from react.
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
