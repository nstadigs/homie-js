import type { PropertyElementProps } from "../jsx-runtime.ts";

export function Color(
  props: Extract<PropertyElementProps, { datatype: "color" }>,
) {
  return <property$ {...props} />;
}
