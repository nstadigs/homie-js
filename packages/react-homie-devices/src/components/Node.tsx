import type { NodeElementProps } from "../jsx-runtime.ts";

export function Node(
  props: NodeElementProps,
) {
  return <node$ {...props} />;
}
