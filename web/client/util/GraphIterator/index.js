// @flow
/* eslint-disable no-use-before-define */
import { GraphNodeView } from 'util/GraphIterator/GraphNodeView';

/**
 * Generic graph iterator to traverse a deeply nested graph.
 * In order to create a GraphIterator class for your specific use case, you
 * need to create a NodeView class that implements the GraphNodeView interface.
 *
 * Example:
 *   class DropdownGraphNodeView implements GraphNodeView<
 *     ?DropdownChildType,
 *     React.ChildrenArray<?DropdownChildType>,
 *   > {
 *     forEach(children, func) {
 *       // how to iterate over a collection of children
 *     }
 *     children(node) {
 *       // how to extract the children from a Dropdown option
 *     }
 *   }
 *
 *  Once you've created a view for your node type, you can create a
 *  GraphIterator class by just doing:
 *
 *  const DropdownOptionIterator = GraphIterator.with(DropdownGraphNodeView);
 *
 *  Usage:
 *    Find if any node's value is 'myValue':
 *      DropdownOptionIterator
 *        .create(options)
 *        .findAny(node => node.props.value === 'myValue');
 *
 *  Successive calls with the same iterator are safe to do:
 *    const iterator = DropdownOptionIterator.create(options);
 *    iterator.forEach(...);
 *    iterator.findAny(...);
 *
 * WHY DO WE USE NODE VIEWS??
 *
 * There is no ~one true way~ to represent a graph. For example, a Dropdown's
 * option tree is a mix of OptionsGroup and Option nodes. And the children
 * are held in a React.ChildrenArray rather than a regular array.
 * But the HierarchyItem tree in our HierarchicalSelector component is entirely
 * just HierarchyItem models, and children are represented as ZenArrays.
 *
 * We can't impose a single way to represent a graph. So if we want a generic
 * GraphIterator, we need to create a GraphNodeView that will provide a standard
 * interface needed to iterate over the graph.
 *
 */

type IterationTypeMap = {
  FIND_ANY: 'FIND_ANY',
  FOR_EACH: 'FOR_EACH',
};
type IterationType = $Keys<IterationTypeMap>;

const ITERATION_TYPES: IterationTypeMap = {
  FIND_ANY: 'FIND_ANY',
  FOR_EACH: 'FOR_EACH',
};

export default class GraphIterator<Node, Children> {
  +_NodeView: GraphNodeView<Node, Children>;
  _nodeArray: Array<Node> = [];
  _expandedParents: Set<Node> = new Set();

  /**
   * When you create a GraphIterator, you must pass in the starting children
   * you want to iterate over, and also the NodeView class that will be used
   * to extract information from each node.
   */
  static create<_Node, _Children>(
    startingValues: _Children,
    NodeView: GraphNodeView<_Node, _Children>,
  ): GraphIterator<_Node, _Children> {
    return new GraphIterator(startingValues, NodeView);
  }

  constructor(
    startingValues: Children,
    NodeView: GraphNodeView<Node, Children>,
  ) {
    this._NodeView = NodeView;
    this._addChildrenToBaseArray(startingValues);
  }

  _addChildrenToBaseArray(children: Children): void {
    this._NodeView.forEach(children, child => this._nodeArray.push(child));
  }

  /**
   * Iterate through a potentially deeply nested graph.
   * We call `iteratorFunc` on each node, and handle the return type depending
   * on which iteration type was specified.
   */
  _deepIterate<T>(
    iteratorFunc: Node => T,
    iterationType: IterationType,
  ): Node | void {
    // using a for loop because we need to modify the array mid-execution
    for (let i = 0; i < this._nodeArray.length; i++) {
      const node = this._nodeArray[i];
      switch (iterationType) {
        case ITERATION_TYPES.FIND_ANY: {
          if (iteratorFunc(node)) {
            return node;
          }
          break;
        }
        case ITERATION_TYPES.FOR_EACH: {
          iteratorFunc(node);
          break;
        }
        default:
          throw new Error('[GraphIterator] Invalid Iteration Type supplied');
      }

      if (!this._expandedParents.has(node)) {
        const nextChildren = this._NodeView.children(node);
        if (nextChildren) {
          this._addChildrenToBaseArray(nextChildren);
        }
        this._expandedParents.add(node);
      }
    }

    return undefined;
  }

  /**
   * Iterate through a deeply nested graph. Return the first element for which
   * `func` returns true, otherwise return undefined.
   */
  findAny(func: Node => boolean): Node | void {
    return this._deepIterate(func, ITERATION_TYPES.FIND_ANY);
  }

  /**
   * Iterate through a deeply nested graph and call `func` on each element.
   */
  forEach<T>(func: Node => T): void {
    this._deepIterate(func, ITERATION_TYPES.FOR_EACH);
  }
}
