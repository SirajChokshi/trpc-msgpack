/**
 * Recursively strips undefined values from objects to match JSON.stringify behavior.
 * Returns original references when no changes are needed for optimal performance.
 *
 * @remarks
 * - Circular references are detected and returned as-is (not recursed into)
 * - Maximum recursion depth is 100 to prevent stack overflow
 *
 * @throws {Error} If recursion depth exceeds 100
 */
export function stripUndefined<T>(value: T): T {
  return stripUndefinedInternal(value, new WeakSet(), 0);
}

const MAX_DEPTH = 100;

function stripUndefinedInternal<T>(
  value: T,
  visited: WeakSet<object>,
  depth: number,
): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (depth > MAX_DEPTH) {
    throw new Error(`stripUndefined: Maximum depth of ${MAX_DEPTH} exceeded`);
  }

  const current = value as object;
  if (visited.has(current)) {
    return value;
  }
  visited.add(current);

  if (Array.isArray(value)) {
    let result: unknown[] | null = null;
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const stripped = stripUndefinedInternal(item, visited, depth + 1);
      if (result) {
        result.push(stripped);
      } else if (stripped !== item) {
        result = value.slice(0, i);
        result.push(stripped);
      }
    }
    return (result ?? value) as T;
  }

  const obj = value as Record<string, unknown>;
  let result: Record<string, unknown> | null = null;

  for (const key in obj) {
    const v = obj[key];

    if (v === undefined) {
      if (!result) {
        result = {};
        for (const k in obj) {
          if (k === key) break;
          if (obj[k] !== undefined) result[k] = obj[k];
        }
      }
      continue;
    }

    const stripped = stripUndefinedInternal(v, visited, depth + 1);

    if (result) {
      result[key] = stripped;
    } else if (stripped !== v) {
      result = {};
      for (const k in obj) {
        if (k === key) break;
        if (obj[k] !== undefined) result[k] = obj[k];
      }
      result[key] = stripped;
    }
  }

  return (result ?? value) as T;
}
