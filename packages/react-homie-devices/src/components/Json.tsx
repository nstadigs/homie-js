import type { PropertyElementProps } from "../jsx-runtime.ts";

export function Json(
  props: Extract<PropertyElementProps, { datatype: "json" }>,
) {
  return <property$ {...props} />;
}
