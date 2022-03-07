// @flow
import LRUCache from 'lib/LRUCache';
import type { SearchTerms } from 'lib/StringMatcher/types';

type CacheHolder<T> = {
  caseInsensitive: T,
  caseSensitive: T,
};

// Escape any regex pattern characters in a string.
const ESCAPE_SPECIAL_CHAR_PATTERN = /[-[\]{}()*+?.,\\^$|#\s]/g;
const UNMATCHABLE_PATTERN = /(?!)/g;

// Optimistically cache the RegExp object for a given search term pattern to
// avoid recreating it multiple times.
const PATTERN_CACHE: CacheHolder<LRUCache<RegExp>> = {
  caseInsensitive: new LRUCache<RegExp>(1000),
  caseSensitive: new LRUCache<RegExp>(1000),
};

// Cache the pattern string built for an array of search terms. Using a WeakMap
// since this cache is less important than the RegExp cache above.
type ArrayPatternWeakMap = WeakMap<SearchTerms, string>;
const SEARCH_TERM_CACHE: CacheHolder<ArrayPatternWeakMap> = {
  caseInsensitive: new WeakMap(),
  caseSensitive: new WeakMap(),
};

function _getCacheFromHolder<T>(
  caseSensitive: boolean,
  cacheHolder: CacheHolder<T>,
): T {
  return caseSensitive
    ? cacheHolder.caseSensitive
    : cacheHolder.caseInsensitive;
}

/**
 * Build a RegExp object based on the provided search terms. Optimistically
 * cache the results so that subsequent calls will not have to rebuild the
 * RegExp.
 */
export function buildSearchPattern(
  searchTerms: SearchTerms,
  caseSensitive: boolean,
): RegExp {
  if (searchTerms.length === 0) {
    return UNMATCHABLE_PATTERN;
  }

  // Check if this SearchTerms input array has already been seen.
  const searchTermCache = _getCacheFromHolder(caseSensitive, SEARCH_TERM_CACHE);

  let patternString = searchTermCache.get(searchTerms);
  if (patternString === undefined) {
    // Build the search pattern by OR-ing all terms together. Replace any
    // regex characters in the search terms since we are constructing a pattern
    // that searches for the terms exactly as they are provided.

    // NOTE(nina): For searches that include accentuation, we want to
    // remove that accentuation when matching against the actual
    // search results. EX: 'Gravida' is a valid search result for the
    // search term 'Grãvida'
    patternString = searchTerms
      .map(term =>
        term
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(ESCAPE_SPECIAL_CHAR_PATTERN, '\\$&'),
      )
      .join('|');
    searchTermCache.set(searchTerms, patternString);
  }

  // Check if this pattern has already been seen and return the cached regex
  // if it has.
  const regexCache = _getCacheFromHolder(caseSensitive, PATTERN_CACHE);
  const cachedRegex = regexCache.get(patternString);
  if (cachedRegex !== undefined) {
    return cachedRegex;
  }

  const pattern = new RegExp(patternString, caseSensitive ? 'g' : 'gi');
  regexCache.set(patternString, pattern);
  return pattern;
}
