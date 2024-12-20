import type { PropertyElementProps } from "../jsx-runtime.ts";

export function DateTime(
  props: Extract<PropertyElementProps, { datatype: "datetime" }>,
) {
  return <property$ {...props} />;
}
