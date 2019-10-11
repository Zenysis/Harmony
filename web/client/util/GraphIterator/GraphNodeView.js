// @flow

/**
 * Generic GraphNodeView used to provide an interface around a node of any type
 * so that the GraphIterator can have a standard interface to operate on any
 * node type.
 *
 * NOTE(pablo): Flow Interfaces do not support static types, so any class that
 * implements this interface should be a singleton class (like our Services),
 * so they can effectively be treated as static functions.
 *
 */
export interface GraphNodeView<Node, Children> {
  constructor(): void;

  /**
   * Given a collection of Children (e.g. Array<Node>, ZenArray<Node>,
   * React.ChildrenArray<Node>, etc.), this function provides a way to iterate
   * across the collection.
   */
  forEach(children: Children, func: (Node) => mixed): void;

  /**
   * Given a node, extract its children.
   */
  children(node: Node): ?Children;
}
