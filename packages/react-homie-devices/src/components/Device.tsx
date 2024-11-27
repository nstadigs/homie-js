import { DeviceElementProps } from "../jsx-runtime.ts";

export function Device(
  props: DeviceElementProps,
) {
  // create a custom jsx element
  return <device$ {...props} />;
}
