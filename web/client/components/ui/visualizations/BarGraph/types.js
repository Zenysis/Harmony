// @flow
import type {
  GoalLineTheme,
  YAxisID,
} from 'components/ui/visualizations/common/MetricAxis/types';
import type {
  ValuePosition,
  VisualDisplayShape,
} from 'models/core/QueryResultSpec/QueryResultSeries';

export type DimensionID = string;
export type MetricID = string;

export type DataPoint = {
  dimensions: {
    +[DimensionID]: string | null,
  },
  metrics: {
    +[MetricID]: number | null,
  },
};

export type BarGroupSpec = {
  field: string,
  sortAscending: boolean,
  type: 'dimension' | 'metric',
};

// TODO(stephen): FIX THIS.
type BandScale = $FlowTODO;
type LinearScale = $FlowTODO;

export type ScaleMap = {
  /**
   * Positioning of the individual bars within a group.
   */
  +barScale: BandScale,

  /**
   * Positioning of the bar groups along the x-axis.
   */
  +barGroupScale: BandScale,

  /**
   * Scale for the Y1 (primary) y-axis.
   */
  +y1Scale: LinearScale | void,

  /**
   * Scale for the Y2 (secondary) y-axis.
   */
  +y2Scale: LinearScale | void,
};

export type Metric = {
  axis: YAxisID,
  barLabelPosition: ValuePosition,
  color: string,
  displayName: string,
  formatValue: (number | null) => string | number,
  id: MetricID,
  showValue: boolean,
  valueFontSize: number | string,

  /**
   * The angle the value text should be drawn at when it is displayed. If `auto`
   * is supplied, the angle will be calculated based on the bar graph type and
   * current bar dimensions so that the text looks pleasing.
   */
  valueTextAngle: number | 'auto',
  visualDisplayShape: VisualDisplayShape,
};

// TODO(stephen): Kind of a StyleObject type but different. Need a better type
// for this.
type LabelProps = $FlowTODO;

type AxisTheme = {
  stroke: string,
  ticks: {
    color: string,
    label: LabelProps,
  },
  title: LabelProps,
};

export type BarGraphTheme = {
  axis: {
    xAxis: {
      maxInnerLayerTextLength: number | void,
      ...AxisTheme,
    },
    y1Axis: AxisTheme,
    y2Axis: AxisTheme,
  },
  backgroundColor: string,
  focus: {
    activeColor: string,
    height: number,
    inactiveColor: string,
  },
  goalLine: {
    hover: GoalLineTheme,
    placed: GoalLineTheme,
  },
  groupPadding: number,
  innerBarPadding: number,
  minBarHeight: number,
  minBarWidth: number,
  stroke: string,
  strokeWidth: number,
  tickColor: string,
};

export type AxisRanges = {
  y1Axis: { min: number | void, max: number | void },
  y2Axis: { min: number | void, max: number | void },
};
