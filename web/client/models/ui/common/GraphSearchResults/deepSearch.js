// @flow
import GraphIterator from 'util/GraphIterator';
import type StringMatcher from 'lib/StringMatcher';
import type { SearchableNodeView } from 'models/ui/common/GraphSearchResults/types';

type SearchResults<ParentValue, LeafValue> = {
  leavesThatMatchSearch: Set<LeafValue>,
  parentsThatMatchSearch: Set<ParentValue>,
  parentsWithChildrenThatMatchSearch: Set<ParentValue>,

  /**
   * Map each node ID to a match score of how well they match the search
   * string
   */
  matchScores: Map<LeafValue | ParentValue, number>,
};

/**
 * Check if a given `node` matches the search regex.
 * @returns {boolean} Did the node match the search regex
 */
function _doesNodeMatchSearch<ParentValue, LeafValue, Node, Children>(
  NodeView: SearchableNodeView<ParentValue, LeafValue, Node, Children>,
  node: Node,
  matcher: StringMatcher,
): boolean {
  return !!node && matcher.matchesAll(NodeView.searchableText(node));
}

/**
 * Check if a node matches the regex, and calculate the match score if
 * they do. A match score measures how strongly this node matched against
 * the search terms. The score is a value between 0 and 1. The score is 0
 * if there is no match.
 *
 * Currently, the match score is just a percentage calculation
 * of the search term length divided by the node's text length. So the
 * more of the total string length we match, the better.
 *
 * @returns {[boolean, number]} A tuple of boolean and number. The boolean
 * indicates if the node matched the search regex. The number indicates
 * the match score.
 */
function _calculateMatchScore<ParentValue, LeafValue, Node, Children>(
  NodeView: SearchableNodeView<ParentValue, LeafValue, Node, Children>,
  node: Node,
  matcher: StringMatcher,
): [boolean, number] {
  const hasMatch = _doesNodeMatchSearch(NodeView, node, matcher);
  let matchScore = 0;
  if (hasMatch && node) {
    const searchTermsLength = matcher
      .getSearchTerms()
      .reduce((len, t) => len + t.length, 0);
    matchScore = searchTermsLength / NodeView.searchableText(node).length;
  }
  return [hasMatch, matchScore];
}

/**
 * Check if any of the given `node`'s children match the search regex.
 */
function _doNodeChildrenMatchSearch<ParentValue, LeafValue, Node, Children>(
  NodeView: SearchableNodeView<ParentValue, LeafValue, Node, Children>,
  matcher: StringMatcher,
  node: Node,
): boolean {
  const children = NodeView.children(node);
  if (children) {
    const doesAChildPassSearch = GraphIterator.create(
      children,
      NodeView,
    ).findAny((child: Node) => _doesNodeMatchSearch(NodeView, child, matcher));
    return !!doesAChildPassSearch;
  }
  return false;
}

/**
 * Processes a single node and updates the searchResults with any leaves or
 * parents that matched the search in this node.
 * NOTE(pablo): this function has side effects. The searchResults argument is
 * modified in place.
 */
function _processNode<ParentValue, LeafValue, Node, Children>(
  NodeView: SearchableNodeView<ParentValue, LeafValue, Node, Children>,
  searchResults: SearchResults<ParentValue, LeafValue>,
  matcher: StringMatcher,
  node: Node,
): void {
  if (node === undefined || node === null) {
    return;
  }

  const value = NodeView.value(node);
  const {
    leavesThatMatchSearch,
    parentsThatMatchSearch,
    parentsWithChildrenThatMatchSearch,
    matchScores,
  } = searchResults;

  const [matchedSearch, matchScore] = _calculateMatchScore(
    NodeView,
    node,
    matcher,
  );

  // if we have a match, and we hadn't computed this match score before,
  // then add it to our `matchScores` map
  if (matchedSearch && !matchScores.has(value)) {
    matchScores.set(value, matchScore);
  }

  if (NodeView.isLeaf(node) && matchedSearch) {
    leavesThatMatchSearch.add(((value: $Cast): LeafValue));
  } else if (matchedSearch) {
    parentsThatMatchSearch.add(((value: $Cast): ParentValue));
  } else {
    // if this group did not match the search, maybe one of its
    // children did?
    const doesAChildPassSearch = _doNodeChildrenMatchSearch(
      NodeView,
      matcher,
      node,
    );
    if (doesAChildPassSearch) {
      parentsWithChildrenThatMatchSearch.add(((value: $Cast): ParentValue));
    }
  }
}

/**
 * Iterate through a deeply nested graph and test each node against the
 * string matcher.
 * Return an object of search results with information on which nodes matched
 * the search, which parents matched, and which parents matched only because
 * they have a child that passed the search.
 */
export default function deepSearch<ParentValue, LeafValue, Node, Children>(
  NodeView: SearchableNodeView<ParentValue, LeafValue, Node, Children>,
  matcher: StringMatcher,
  nodes: Children,
): SearchResults<ParentValue, LeafValue> {
  // searchResults will be modified in place by the _processNode function
  const searchResults: SearchResults<ParentValue, LeafValue> = {
    leavesThatMatchSearch: new Set(),
    parentsThatMatchSearch: new Set(),
    parentsWithChildrenThatMatchSearch: new Set(),
    matchScores: new Map(),
  };

  if (nodes) {
    GraphIterator.create(nodes, NodeView).forEach((node: Node) =>
      _processNode(NodeView, searchResults, matcher, node),
    );
  }
  return searchResults;
}
