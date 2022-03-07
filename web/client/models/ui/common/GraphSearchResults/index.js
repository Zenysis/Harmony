// @flow
import StringMatcher from 'lib/StringMatcher';
import deepSearch from 'models/ui/common/GraphSearchResults/deepSearch';
import type { SearchableNodeView } from 'models/ui/common/GraphSearchResults/types';

export default class GraphSearchResults<ParentValue, LeafValue> {
  +searchText: string;
  +matcher: StringMatcher;

  // all parents that match the search terms
  +parentsThatMatchSearch: $ReadOnlySet<ParentValue> = new Set();

  // all parents that do not match the search terms, but have children
  // that do.
  +parentsWithChildrenThatMatchSearch: $ReadOnlySet<ParentValue> = new Set();

  // all leaves that match the search terms
  +leavesThatMatchSearch: $ReadOnlySet<LeafValue> = new Set();

  +matchScores: $ReadOnlyMap<LeafValue | ParentValue, number> = new Map();

  static fromSearchText<_ParentValue, _LeafValue, Node, Children>(
    NodeView: SearchableNodeView<_ParentValue, _LeafValue, Node, Children>,
    searchText: string,
    children: Children,
  ): GraphSearchResults<_ParentValue, _LeafValue> {
    const terms = searchText
      .split(' ')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const matcher = new StringMatcher(terms, false, true, 20000);
    const {
      leavesThatMatchSearch,
      parentsThatMatchSearch,
      parentsWithChildrenThatMatchSearch,
      matchScores,
    } = deepSearch(NodeView, matcher, children);

    return new GraphSearchResults(
      searchText,
      matcher,
      parentsThatMatchSearch,
      parentsWithChildrenThatMatchSearch,
      leavesThatMatchSearch,
      matchScores,
    );
  }

  constructor(
    searchText?: string = '',
    matcher?: StringMatcher = new StringMatcher([], false, true, 20000),
    parentsThatMatchSearch?: $ReadOnlySet<ParentValue> = new Set(),
    parentsWithChildrenThatMatch?: $ReadOnlySet<ParentValue> = new Set(),
    leavesThatMatchSearch?: $ReadOnlySet<LeafValue> = new Set(),
    matchScores?: $ReadOnlyMap<ParentValue | LeafValue, number> = new Map(),
  ) {
    this.searchText = searchText;
    this.matcher = matcher;
    this.parentsThatMatchSearch = parentsThatMatchSearch;
    this.parentsWithChildrenThatMatchSearch = parentsWithChildrenThatMatch;
    this.leavesThatMatchSearch = leavesThatMatchSearch;
    this.matchScores = matchScores;
  }

  /**
   * Get a node value's match score, which measures how well this node's
   * searchableText matched against the search text.
   */
  getMatchScore(value: ParentValue | LeafValue): number {
    return this.matchScores.get(value) || 0;
  }

  someLeafMatchesValue(value: LeafValue): boolean {
    return this.leavesThatMatchSearch.has(value);
  }

  someParentMatchesValue(value: ParentValue): boolean {
    return this.parentsThatMatchSearch.has(value);
  }

  someParentOrChildMatchesValue(value: ParentValue): boolean {
    return (
      this.parentsThatMatchSearch.has(value) ||
      this.parentsWithChildrenThatMatchSearch.has(value)
    );
  }

  /**
   * Check if any leaves or parents match the search directly
   */
  hasNoMatches(): boolean {
    return (
      this.leavesThatMatchSearch.size === 0 &&
      this.parentsThatMatchSearch.size === 0
    );
  }

  /**
   * Get all parents that either matched the search directly, or have a child
   * that matched the search term
   */
  getAllParents(): $ReadOnlySet<ParentValue> {
    return new Set([
      ...this.parentsWithChildrenThatMatchSearch,
      ...this.parentsThatMatchSearch,
    ]);
  }
}
