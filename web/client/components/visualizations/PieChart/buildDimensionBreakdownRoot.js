// @flow
import type { HierarchyNode } from 'models/visualizations/ExpandoTree/types';
import type { PieNode } from 'components/ui/visualizations/PieChart/PieChartDrilldown/types';

// Safely handle null and non-finite values. Custom calculations can produce
// NaN, while the original query result can return null as a valid value.
function metricValue(
  metrics: { +[string]: number | null, ... },
  fieldId: string,
): number {
  const rawValue = metrics[fieldId];
  return rawValue !== null && Number.isFinite(rawValue) ? rawValue : 0;
}

function buildDimensionBreakdown(
  children: $ReadOnlyArray<HierarchyNode>,
  seriesOrder: $ReadOnlyArray<string>,
): [PieNode, $ReadOnlyArray<string>] {
  // Build separate nodes for each field. Collect the values reported for
  // each dimension in the node's metrics.
  const fieldCollection = {};

  // Sum all metric values for each unique dimension value into a single
  // number for that dimension value to display at the root node.
  const rootSegments = {};

  const uniqueChildren = new Set();
  children.forEach(({ metrics, name }) => {
    uniqueChildren.add(name);
    rootSegments[name] = rootSegments[name] || 0;

    seriesOrder.forEach(fieldId => {
      if (fieldCollection[fieldId] === undefined) {
        fieldCollection[fieldId] = {
          levels: { fieldId },
          segments: {},
        };
      }
      const value = metricValue(metrics, fieldId);
      fieldCollection[fieldId].segments[name] = value;
      rootSegments[name] += value;
    });
  });
  const root = {
    children:
      children.length > 0
        ? seriesOrder.map(id => fieldCollection[id])
        : undefined,
    levels: {},
    segments: rootSegments,
  };

  // Alphabetically sort the children so that the order is deterministic and
  // easy to scan.
  const childOrder = Array.from(uniqueChildren).sort();
  return [root, childOrder];
}

// If there are too many segments to show, we need to collapse the smallest
// segments into a single "other" segment.
function buildLimitedChildren(
  children: $ReadOnlyArray<HierarchyNode>,
  seriesOrder: $ReadOnlyArray<string>,
  childTotals: { +[string]: number | null, ... },
  limit: number,
  collapsedSegmentPrefix: string,
): $ReadOnlyArray<HierarchyNode> {
  const collapseCount = children.length - limit;

  // Sort the children names by their total segment value (smallest to largest).
  const sortedChildren = children
    .map(({ name }) => [name, metricValue(childTotals, name)])
    .sort(([, sizeA], [, sizeB]) => sizeA - sizeB)
    .map(([child]) => child);

  // Keep the largest children and merge the remaining children into a smaller
  // segment.
  const childrenToCollapse = new Set(sortedChildren.slice(0, collapseCount));

  const collapsedMetrics = {};
  const newChildren = [];
  seriesOrder.forEach(fieldId => {
    collapsedMetrics[fieldId] = 0;
  });
  children.forEach(node => {
    const { metrics, name } = node;
    if (!childrenToCollapse.has(name)) {
      newChildren.push(node);
      return;
    }

    // If we are not keeping this child, combine its metrics with all the
    // other collapsed children's metrics.
    seriesOrder.forEach(fieldId => {
      collapsedMetrics[fieldId] += metricValue(metrics, fieldId);
    });
  });

  newChildren.push({
    dimension: '',
    metrics: collapsedMetrics,
    name: `${collapsedSegmentPrefix} (${collapseCount})`,
  });
  return newChildren;
}

// This breakdown style swaps the dimensions for the metrics, so the
// drilldown switches from the Total (at the root) to separate pies for
// each metric. The segments of the pies are the unique dimension values of
// the first level of the tree.
export default function buildDimensionBreakdownRoot(
  children: $ReadOnlyArray<HierarchyNode>,
  seriesOrder: $ReadOnlyArray<string>,
  segmentLimit: number | void = undefined,
  collapsedSegmentPrefix: string = '',
): [PieNode, $ReadOnlyArray<string>] {
  const [root, childOrder] = buildDimensionBreakdown(children, seriesOrder);
  if (segmentLimit === undefined || childOrder.length <= segmentLimit) {
    return [root, childOrder];
  }
  // Collapse the smallest n children into a single segment to be shown in the
  // pie.
  const newChildren = buildLimitedChildren(
    children,
    seriesOrder,
    root.segments,
    segmentLimit,
    collapsedSegmentPrefix,
  );

  // Build a new tree over our limited children.
  const [newRoot, rawChildOrder] = buildDimensionBreakdown(
    newChildren,
    seriesOrder,
  );

  // Ensure the collapsed segment is always listed last.
  const collapsedSegmentName = newChildren[newChildren.length - 1].name;
  const newChildOrder = rawChildOrder.filter(n => n !== collapsedSegmentName);
  newChildOrder.push(collapsedSegmentName);
  return [newRoot, newChildOrder];
}
