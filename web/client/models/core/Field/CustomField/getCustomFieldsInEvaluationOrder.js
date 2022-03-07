// @flow
import type CustomField from 'models/core/Field/CustomField';

type Graph = {
  /** Each node is a string id that represents a custom field */
  nodes: Array<string>,

  /**
   * An edge is a mapping of a custom field's string id to an array of
   * custom field ids that depend on it. In other words, the key is
   * a custom field id that must be evaluated first before we can
   * process the array of its dependents.
   */
  edges: Map<string, Array<string>>,
};

function topoSortHelper(
  node: string,
  exploredSet: Set<string>,
  stack: Array<string>,
  graph: Graph,
): void {
  // mark node as visited
  exploredSet.add(node);

  // now move onto all nodes dependent on this node
  const edges = graph.edges.get(node);
  if (edges) {
    edges.forEach(dependentNode => {
      if (!exploredSet.has(dependentNode)) {
        topoSortHelper(dependentNode, exploredSet, stack, graph);
      }
    });
  }

  // all dependencies have been resolved for this node, so we can now
  // add it to the stack
  stack.push(node);
}

/**
 * Process a graph and return the nodes in topological sort order.
 * This code is based off of the topological sort code found here:
 * https://www.tutorialspoint.com/Topological-sorting-using-Javascript-DFS
 */
function topoSort(graph: Graph): $ReadOnlyArray<string> {
  const stack = [];
  const explored = new Set();
  graph.nodes.forEach(node => {
    if (!explored.has(node)) {
      topoSortHelper(node, explored, stack, graph);
    }
  });

  // reverse the stack to get the correct order
  return stack.reverse();
}

/**
 * Sort an array of custom fields into the order in which they should be
 * evaluated. This returns a new array - it does not sort in place.
 *
 * This function performs a topological sort to ensure that any custom fields
 * that are used as dependencies are evaluated first.
 *
 * @param {Array<CustomField>} customFields The custom fields to sort
 * @returns {Array<CustomField>} A sorted array of custom fields
 */
export default function getCustomFieldsInEvaluationOrder(
  customFields: $ReadOnlyArray<CustomField>,
): $ReadOnlyArray<CustomField> {
  // create a lookup map for each custom field id, and get
  // a list of all nodes as string ids
  const idToCustomField: Map<string, CustomField> = new Map();
  const nodes = [];
  customFields.forEach(customField => {
    nodes.push(customField.id());
    idToCustomField.set(customField.id(), customField);
  });

  // now build all of the graph's edges
  const edges: Map<string, Array<string>> = customFields.reduce(
    (map, customField) => {
      const customFieldId = customField.id();

      // ignore dependencies that aren't custom fields
      const dependencies = customField
        .formula()
        .fields()
        .filter(field => idToCustomField.has(field.id()));

      dependencies.forEach(parentField => {
        const parentId = parentField.id();
        const children = map.get(parentId);
        if (children) {
          children.push(customFieldId);
        } else {
          map.set(parentId, [customFieldId]);
        }
      });

      return map;
    },
    new Map(),
  );

  const sortedIds = topoSort({ nodes, edges });
  return sortedIds.map(id => idToCustomField.get(id)).filter(Boolean);
}
