// @flow

/** Get the difference between two sets */
export function difference<T>(a: $ReadOnlySet<T>, b: $ReadOnlySet<T>): Set<T> {
  if (a === b) {
    return new Set();
  }

  const output = new Set();
  a.forEach(v => output.add(v));
  b.forEach(v => output.delete(v));
  return output;
}
