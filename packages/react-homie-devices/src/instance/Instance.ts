import { Device } from "./Device.ts";
import { Node } from "./Node.ts";
import { Property } from "./Property.ts";
import type { JSX } from "../jsx.d.ts";

export type Instance = {
  id: string;
  instanceType: string;
  addChild(child: Instance): void;
  cloneWithProps(
    props: Record<string, unknown>,
    keepChildren: boolean,
  ): Instance;
  toJSON(): object;
};

export function createInstance<
  TType extends keyof JSX.IntrinsicElements,
  TProps extends JSX.IntrinsicElements[TType],
>(
  type: TType,
  props: TProps,
): Instance {
  switch (type) {
    // FIXME: Properly infer TProps
    case "device$":
      return new Device(props as JSX.DeviceElementProps);
    case "node$":
      return new Node(props as JSX.NodeElementProps);
    case "property$":
      return new Property(props as JSX.PropertyElementProps);
  }

  throw new Error(
    `Invalid type: ${type}. Use exported components Device, Node and Property`,
  );
}
