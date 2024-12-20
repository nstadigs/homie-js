import type { PropertyElementProps } from "../jsx-runtime.ts";

/**
 * Lower level property component. Props mimics the spec
 *
 * @param props
 */
export function Property(
  props: PropertyElementProps,
) {
  return <property$ {...props} />;
}
