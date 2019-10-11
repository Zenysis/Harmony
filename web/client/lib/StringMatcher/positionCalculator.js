// @flow
import LRUCache from 'lib/LRUCache';
import type { Position, PositionArray } from 'lib/StringMatcher/types';

// Cache the match position results for a given RegExp.
type PositionCacheMap = WeakMap<RegExp, LRUCache<PositionArray>>;
const POSITION_CACHE_MAP: PositionCacheMap = new WeakMap();

/**
 * Calculate the string indices (inclusive) of all matched terms in the input
 * string. Optimistically cache the result to improve repeat calls with the same
 * pattern and text.
 */
export function computeMatchPositions(
  text: string,
  pattern: RegExp,
): PositionArray {
  // Check if this pattern has been seen before and add a new entry to the cache
  // if it has not.
  let positionCache = POSITION_CACHE_MAP.get(pattern);
  if (positionCache === undefined) {
    positionCache = new LRUCache(2000);
    POSITION_CACHE_MAP.set(pattern, positionCache);
  }

  const cachedPosition = positionCache.get(text);
  if (cachedPosition !== undefined) {
    return cachedPosition;
  }

  // NOTE(stephen): Need to "reset" the regex since it is cached. This could
  // result in weird behavior if used in an async context.
  // eslint-disable-next-line no-param-reassign
  pattern.lastIndex = 0;

  // Find all substring positions that are matches of the pattern.
  const output: Array<Position> = [];
  let curPosition;
  let matches = pattern.exec(text);
  while (matches !== null) {
    const start = matches.index;
    const end = pattern.lastIndex - 1;

    // Collapse consecutive matches into a single range.
    // NOTE(stephen): Happens in-place on curPosition which has already been
    // added to output. This avoids needing to interact with the output array.
    if (curPosition && curPosition[1] === start) {
      curPosition[1] = end;
    } else {
      curPosition = [start, end];
      output.push(curPosition);
    }

    matches = pattern.exec(text);
  }

  positionCache.set(text, output);
  return output;
}
