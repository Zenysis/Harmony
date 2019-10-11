// @flow
import GraphIterator from 'util/GraphIterator';
import type StringMatcher from 'lib/StringMatcher';
import type { SearchableNodeView } from 'models/ui/common/GraphSearchResults/types';

type SearchResults<ParentValue, LeafValue> = {
  leavesThatMatchSearch: Set<LeafValue>,
  parentsThatMatchSearch: Set<ParentValue>,
  parentsWithChildrenThatMatchSearch: Set<ParentValue>,
};

/**
 * Check if a given `node` matches the search regex.
 */
function _doesNodeMatchSearch<ParentValue, LeafValue, Node, Children>(
  NodeView: SearchableNodeView<ParentValue, LeafValue, Node, Children>,
  node: Node,
  matcher: StringMatcher,
): boolean {
  return !!node && matcher.matchesAll(NodeView.searchableText(node));
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
  } = searchResults;

  const matchedSearch = _doesNodeMatchSearch(NodeView, node, matcher);

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
  };

  if (nodes) {
    GraphIterator.create(nodes, NodeView).forEach((node: Node) =>
      _processNode(NodeView, searchResults, matcher, node),
    );
  }
  return searchResults;
}
