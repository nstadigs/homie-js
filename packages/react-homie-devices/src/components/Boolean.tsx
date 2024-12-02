import type { PropertyElementProps } from "../jsx-runtime.ts";

export function Boolean(
  props: Extract<PropertyElementProps, { datatype: "boolean" }>,
) {
  return <property$ {...props} />;
}
