import type {
  DeviceElementProps,
  NodeElementProps,
  PropertyElementProps,
} from "../jsx-runtime.ts";
import { Device } from "./Device.ts";
import { Node } from "./Node.ts";
import { Property } from "./Property.ts";

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
      return new Device(props as DeviceElementProps);
    case "node$":
      return new Node(props as NodeElementProps);
    case "property$":
      return new Property(props as PropertyElementProps);
  }

  throw new Error(
    `Invalid type: ${type}. Use exported components Device, Node and Property`,
  );
}
