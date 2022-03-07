// @flow
import LRUCache from 'lib/LRUCache';
import { buildSearchPattern } from 'lib/StringMatcher/patternBuilder';
import { computeMatchPositions } from 'lib/StringMatcher/positionCalculator';
import type { PositionArray, SearchTerms } from 'lib/StringMatcher/types';

type CachedResult = {
  matchesAll?: boolean,
  matchesSome?: boolean,
  matchPositions?: PositionArray,
};

/**
 * The StringMatcher provides an efficient way to test if a string matches a
 * set of search terms.
 */
export default class StringMatcher {
  +_cacheSize: number;
  +_pattern: RegExp;
  +_termCount: number;
  +_useCache: boolean;
  +_searchTerms: SearchTerms;

  // Cache the computed results for up to `cacheSize` strings tested by the
  // StringMatcher.
  _matchCache: LRUCache<CachedResult>;

  constructor(
    searchTerms: SearchTerms,
    caseSensitive?: boolean = false,
    useCache?: boolean = true,
    cacheSize?: number = 2000,
  ) {
    this._pattern = buildSearchPattern(searchTerms, caseSensitive);
    this._searchTerms = searchTerms;
    this._termCount = searchTerms.length;
    this._useCache = useCache;
    this._cacheSize = cacheSize;
  }

  /**
   * Get the original search terms passed to this StringMatcher.
   * @returns {SearchTerms}
   */
  getSearchTerms(): SearchTerms {
    return this._searchTerms;
  }

  /**
   * Test if all of the search terms can be found in the provided string.
   */
  matchesAll(textToSearch: string): boolean {
    const cachedResult = this._getCachedResult(textToSearch);
    if (cachedResult !== undefined && cachedResult.matchesAll !== undefined) {
      return cachedResult.matchesAll;
    }

    // NOTE(nina): In order to deal with situations of an accented search term
    // or an accented search result, we want to remove the accents of both the
    // search term and the search result. The _pattern property is built from
    // StringMatcher/patternBuilder.js to remove the accents of the search
    // terms. This line does the same for the specific search result we
    // are matching against.
    const matches = textToSearch
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .match(this._pattern);
    let matchesAll = false;

    if (!!matches && matches.length >= this._termCount) {
      // To compute the unique terms found, we construct a set over the matches
      // found.
      const uniqueMatches = this._pattern.ignoreCase
        ? new Set(matches.map(m => m.toLocaleLowerCase()))
        : new Set(matches);
      matchesAll = uniqueMatches.size === this._termCount;
    }

    if (cachedResult !== undefined) {
      cachedResult.matchesAll = matchesAll;
      cachedResult.matchesSome = !!matches;
      if (!matches) {
        cachedResult.matchPositions = [];
      }
    }

    return matchesAll;
  }

  /**
   * Test if any of the search terms can be found in the provided string.
   */
  matchesSome(textToSearch: string): boolean {
    const cachedResult = this._getCachedResult(textToSearch);
    if (cachedResult !== undefined && cachedResult.matchesSome !== undefined) {
      return cachedResult.matchesSome;
    }

    // NOTE(nina): In order to deal with situations of an accented search term
    // or an accented search result, we want to remove the accents of both the
    // search term and the search result. The _pattern property is built from
    // StringMatcher/patternBuilder.js to remove the accents of the search
    // terms. This line does the same for the specific search result we
    // are matching against.
    const matchesSome = this._pattern.test(
      textToSearch.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    );
    if (cachedResult !== undefined) {
      cachedResult.matchesSome = matchesSome;

      // If none of the search terms match, then we can cache the result of
      // other methods without needing them to be run.
      if (!matchesSome) {
        cachedResult.matchesAll = false;
        cachedResult.matchPositions = [];
      }
    }

    return matchesSome;
  }

  /**
   * Find the search terms that can be found in the provided string. Calculate
   * the position (inclusive) of each matched term.
   */
  getMatchPositions(textToSearch: string): PositionArray {
    const cachedResult = this._getCachedResult(textToSearch);
    if (
      cachedResult !== undefined &&
      cachedResult.matchPositions !== undefined
    ) {
      return cachedResult.matchPositions;
    }

    const matchPositions = computeMatchPositions(
      // NOTE(nina): In order to deal with situations of an accented search term
      // or an accented search result, we want to remove the accents of both the
      // search term and the search result. The _pattern property is built from
      // StringMatcher/patternBuilder.js to remove the accents of the search
      // terms. This line does the same for the specific search result we
      // are matching against.
      textToSearch.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      this._pattern,
    );
    if (cachedResult !== undefined) {
      cachedResult.matchPositions = matchPositions;
      if (matchPositions.length === 0) {
        cachedResult.matchesAll = false;
        cachedResult.matchesSome = false;
      } else {
        cachedResult.matchesSome = true;
      }
    }

    return matchPositions;
  }

  /**
   * Find the previously calculated results that have been cached for the
   * provided string. If the string has not been seen before, add a new empty
   * cache entry. If caching is disabled, return undefined.
   */
  _getCachedResult(textToSearch: string): CachedResult | void {
    if (!this._useCache) {
      return undefined;
    }

    // Lazily instantiate the match cache.
    if (this._matchCache === undefined) {
      this._matchCache = new LRUCache(this._cacheSize);
    }

    let cachedResult = this._matchCache.get(textToSearch);
    if (cachedResult === undefined) {
      cachedResult = {
        matchesAll: undefined,
        matchesSome: undefined,
        matchPositions: undefined,
      };
      this._matchCache.set(textToSearch, cachedResult);
    }
    return cachedResult;
  }
}
