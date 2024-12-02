import type { PropertyElementProps } from "../jsx-runtime.ts";

export function Enum(
  props: Extract<PropertyElementProps, { datatype: "enum" }>,
) {
  return <property$ {...props} />;
}
