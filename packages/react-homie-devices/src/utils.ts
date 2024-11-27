const hasOwnProperty = Object.prototype.hasOwnProperty;

export function shallowEqual(
  objA: unknown,
  objB: unknown,
): [boolean, string | null] {
  if (Object.is(objA, objB)) {
    return [true, null];
  }

  if (
    typeof objA !== "object" || objA === null ||
    typeof objB !== "object" || objB === null
  ) {
    return [false, "type differs"];
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return [false, "length differs"];
  }

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i++) {
    if (
      !hasOwnProperty.call(objB, keysA[i]) ||
      !Object.is(
        (objA as Record<string, unknown>)[keysA[i]],
        (objB as Record<string, unknown>)[keysA[i]],
      )
    ) {
      return [false, keysA[i]];
    }
  }

  return [true, null];
}
