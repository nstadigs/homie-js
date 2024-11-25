import React from "react";
import type _JSX from "./jsx.d.ts";

export function Device(
  { children, id }: { id: string; children?: React.ReactNode },
) {
  // create a custom jsx element
  return <device$ id={id}>{children}</device$>;
}

export function Node(
  { children, id }: { id: string; children?: React.ReactNode },
) {
  // create a custom jsx element
  return <node$ id={id}>{children}</node$>;
}

export function Property(
  { id }: { id: string },
) {
  // create a custom jsx element
  return <property$ id={id} />;
}
