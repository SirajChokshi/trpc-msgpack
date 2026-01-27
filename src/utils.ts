/**
 * Recursively strips undefined values from objects to match JSON.stringify behavior.
 * Returns original references when no changes are needed for optimal performance.
 */
export function stripUndefined<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    let result: unknown[] | null = null;
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const stripped = stripUndefined(item);
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

    const stripped = stripUndefined(v);

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
