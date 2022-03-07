// @flow

/**
 * This function normalizes aria names to all lower-case to make them easily
 * searchable, which does not affect their readability for screen readers.
 * However, fully capitalized words will stay that way, since these usually need
 * to be read one letter at a time.
 */
export default function normalizeARIAName(name: string | void): string | void {
  if (name === undefined) {
    return undefined;
  }

  const words = name
    .split(' ')
    .map(w => (w === w.toUpperCase() ? w : w.toLowerCase()));
  return words.join(' ');
}
