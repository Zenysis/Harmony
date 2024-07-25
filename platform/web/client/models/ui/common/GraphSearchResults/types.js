// @flow
import type { GraphNodeView } from 'util/GraphIterator/GraphNodeView';

/**
 * An interface that is used to allow a Node to be searchable through
 * our `deepSearch` function. It adds support to check if a node is a leaf,
 * what its searchableText is, and what its unique value is.
 *
 * A SearchableNodeView extends GraphNodeView, so must also implement those
 * functions so that it can work with a GraphIterator.
 */
export interface SearchableNodeView<ParentValue, LeafValue, Node, Children>
  extends GraphNodeView<Node, Children> {
  isLeaf(node: Node): boolean;
  searchableText(node: Node): string;

  /** The unique value used to identify a node */
  value(node: Node): ParentValue | LeafValue;
}
