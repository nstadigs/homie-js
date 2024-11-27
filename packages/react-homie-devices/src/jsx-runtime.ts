import type { Property } from "@nstadigs/homie-spec";

declare global {
  namespace JSX {
    type DeviceElementProps = {
      id: string;
      children?: React.ReactNode;
      name?: string;
      type?: string;
    };

    type NodeElementProps = {
      id: string;
      children?: React.ReactNode;
      name?: string;
      type?: string;
    };

    type PropertyElementProps = Property & {
      id: string;
    };
    interface IntrinsicElements {
      device$: DeviceElementProps;
      node$: NodeElementProps;
      property$: PropertyElementProps;
    }
  }
}
