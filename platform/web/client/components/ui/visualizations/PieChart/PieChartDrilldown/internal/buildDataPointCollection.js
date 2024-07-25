// @flow
import type {
  DataPointCollection,
  PieNode,
  Segment,
} from 'components/ui/visualizations/PieChart/PieChartDrilldown/types';

/**
 * Convert the drilldown `PieNode` into a `DataPointCollection` for the Pie
 * chart to use.
 */
export default function buildDataPointCollection(
  label: string,
  node: PieNode,
  segmentOrder: $ReadOnlyArray<Segment>,
): DataPointCollection {
  return {
    label,
    node,
    dataPoints: segmentOrder.map(({ color, id }) => ({
      color,
      key: id,
      value: node.segments[id],
    })),
  };
}
