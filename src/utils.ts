/**
 * Recursively strips undefined values from objects to match JSON.stringify behavior.
 * This ensures msgpack encoding is compatible with tRPC's optional field handling,
 * since msgpack converts undefined → null, but tRPC expects undefined for missing fields.
 *
 * @param value - The value to strip undefined from
 * @returns The value with all undefined properties removed
 *
 * @example
 * ```ts
 * stripUndefined({ a: 1, b: undefined, c: { d: undefined } })
 * // Returns: { a: 1, c: {} }
 * ```
 */
export function stripUndefined<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(stripUndefined) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (v !== undefined) {
      result[k] = stripUndefined(v);
    }
  }
  return result as T;
}
