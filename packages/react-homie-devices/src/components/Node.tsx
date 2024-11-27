import type { NodeElementProps } from "../jsx-runtime.ts";

export function Node(
  props: NodeElementProps,
) {
  // create a custom jsx element
  return <node$ {...props} />;
}
