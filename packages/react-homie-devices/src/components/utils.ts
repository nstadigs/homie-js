import { FloatPropertyElementProps } from "../jsx-runtime.ts";

export function minMaxStepFormat(
  min?: number,
  max?: number,
  step?: number,
): FloatPropertyElementProps["format"] {
  const formatParts = [min, max, step];

  return (formatParts.some((part) => part != null)
    ? formatParts.map((part) => part == null ? "" : part).join(
      ":",
    )
    : undefined) as FloatPropertyElementProps["format"];
}
