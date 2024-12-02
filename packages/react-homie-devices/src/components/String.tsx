import type { PropertyElementProps } from "../jsx-runtime.ts";

export function String(
  props: Extract<PropertyElementProps, { datatype: "string" }>,
) {
  return <property$ {...props} />;
}
