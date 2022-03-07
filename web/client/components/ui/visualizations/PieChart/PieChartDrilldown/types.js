// @flow
import type {
  DataPoint,
  PieChartTheme,
} from 'components/ui/visualizations/PieChart/types';

export type PieNode = {
  /** Child nodes that breakdown this node's values. */
  +children?: $ReadOnlyArray<PieNode>,

  /** The values for each level that this node contributes data to. */
  +levels: {
    +[LevelID: string]: string | null,
    ...,
  },

  /** The numeric segments that make up the different slices of the pie. */
  +segments: {
    +[SegmentID: string]: number | null,
    ...,
  },
};

export type PieChartDrilldownTheme = {
  legendPieSize: number,
  maxColumns: number,
  piePadding: number,
  pieTheme: PieChartTheme,
};

export type Segment = {
  color: string,
  id: string,
  label: string,
};

export type DataPointCollection = {
  dataPoints: $ReadOnlyArray<DataPoint>,
  label: string,
  node: PieNode,
};

export type DrilldownValueSelection = $PropertyType<PieNode, 'levels'>;
