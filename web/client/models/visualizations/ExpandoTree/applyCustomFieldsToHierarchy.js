// @flow
import Queue from 'lib/Queue';
import {
  buildDataFrameFromStandardRows,
  evaluateCustomFields,
} from 'models/core/Field/CustomField/Formula/formulaUtil';
import type CustomField from 'models/core/Field/CustomField';
import type { HierarchyNode } from 'models/visualizations/ExpandoTree/types';

/**
 * Perform a breadth-first traversal across an entire HierarchyNode tree,
 * and get the custom field results for each node.
 *
 * We do this by going down the tree layer by layer, and turning each layer
 * into a dataframe, so each dimension is associated to a dataframe.
 *
 * For example, if the hierarchy is Country => Region => Zone => District,
 * we'd generate 4 dataframes (one for each level). The country-level dataframe
 * would have only 1 row because it consists of only the root node. The
 * region-level dataframe would have 1 row per region node, and so on. This
 * means that each node corresponds to 1 row in a dataframe.
 *
 * At this point we can evaluate the custom fields for each dataframe, and then
 * associate each node to its corresponding results.
 *
 * The return type is a map of HierarchyNode to a dictionary of customFieldId to
 * value.
 */
function _getCustomFieldResultsPerNode(
  root: HierarchyNode,
  customFields: $ReadOnlyArray<CustomField>,
): Map<HierarchyNode, { +[customFieldId: string]: number | null }> {
  const rowsPerLevel: {
    [dimensionId: string]: {
      nodesAtThisLevel: Array<HierarchyNode>,
      rows: Array<{
        dimensions: { +[dimensionId: string]: string | null },
        metrics: { +[metricId: string]: number | null },
      }>,
    },
  } = {};

  // do a breadth-first traversal, to convert each layer of the tree to an
  // array of rows and an array of nodes.
  // To build a row, each node needs to know all the parent dimensions that
  // came before it. So to do that we use a queue of *tuples* that holds a node
  // and a dictionary of all that node's parent dimensions
  const nodesToVisit: Queue<
    [HierarchyNode, { [parentDimensionId: string]: string }],
  > = new Queue();
  nodesToVisit.enqueue([root, {}]);

  while (!nodesToVisit.empty()) {
    // dequeue first node
    const nodeTuple = nodesToVisit.dequeue();

    if (nodeTuple) {
      const [currentNode, parentDimensions] = nodeTuple;
      const currentDimensionId = currentNode.dimension;
      const currentDimensions = {
        ...parentDimensions,
        [currentDimensionId]: currentNode.name,
      };

      // add all children to the queue
      if (currentNode.children) {
        currentNode.children.forEach(childNode => {
          nodesToVisit.enqueue([childNode, currentDimensions]);
        });
      }

      // add current node as a row in `rowsPerLevel`
      const row = {
        dimensions: currentDimensions,
        metrics: currentNode.metrics,
      };
      if (rowsPerLevel[currentDimensionId]) {
        const { rows, nodesAtThisLevel } = rowsPerLevel[currentDimensionId];
        rows.push(row);
        nodesAtThisLevel.push(currentNode);
      } else {
        rowsPerLevel[currentDimensionId] = {
          rows: [row],
          nodesAtThisLevel: [currentNode],
        };
      }
    }
  }

  // now that we've converted each level to an array of rows, we can easily
  // convert each level to a dataframe, then evaluate the custom fields on
  // each dataframe, and then finally associate each node to its results.
  const nodesToCustomFieldValues = new Map<
    HierarchyNode,
    { +[fieldId: string]: number | null },
  >();

  Object.keys(rowsPerLevel).forEach(dimensionId => {
    const { nodesAtThisLevel, rows } = rowsPerLevel[dimensionId];
    const customFieldResults = evaluateCustomFields(
      customFields,
      buildDataFrameFromStandardRows(rows),
    );
    nodesAtThisLevel.forEach((node, nodeIdx) => {
      const fieldValues = {};
      customFieldResults.forEach(({ fieldId, values }) => {
        fieldValues[fieldId] = values[nodeIdx];
      });
      nodesToCustomFieldValues.set(node, fieldValues);
    });
  });

  return nodesToCustomFieldValues;
}

function _applyCustomFieldsToNode(
  root: HierarchyNode,
  nodesToCustomFieldValues: $ReadOnlyMap<
    HierarchyNode,
    { +[customFieldId: string]: number | null },
  >,
): HierarchyNode {
  const { children, metrics } = root;

  // update the children first if they exist (depth-first traversal)
  const newChildren =
    children === undefined
      ? undefined
      : children.map(childNode =>
          _applyCustomFieldsToNode(childNode, nodesToCustomFieldValues),
        );

  // now update the metrics for this ndoe
  const customFieldValues = nodesToCustomFieldValues.get(root);
  const newMetrics = { ...metrics };
  if (customFieldValues) {
    Object.keys(customFieldValues).forEach(fieldId => {
      newMetrics[fieldId] = customFieldValues[fieldId];
    });
  }

  return {
    ...root,
    children: newChildren,
    metrics: newMetrics,
  };
}

export default function applyCustomFieldsToHierarchy(
  root: HierarchyNode,
  customFields: $ReadOnlyArray<CustomField>,
): HierarchyNode {
  const nodesToCustomFieldValues = _getCustomFieldResultsPerNode(
    root,
    customFields,
  );
  return _applyCustomFieldsToNode(root, nodesToCustomFieldValues);
}
