import type { PropertyElementProps } from "../jsx-runtime.ts";

export function Duration(
  props: Extract<PropertyElementProps, { datatype: "duration" }>,
) {
  return <property$ {...props} />;
}
