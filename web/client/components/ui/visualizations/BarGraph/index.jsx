// @flow
import * as React from 'react';
import invariant from 'invariant';
import { RectClipPath } from '@vx/clip-path';
import { scaleBand } from '@vx/scale';

import * as Zen from 'lib/Zen';
import BarGraphTooltip from 'components/ui/visualizations/BarGraph/internal/BarGraphTooltip';
import BarSeries from 'components/ui/visualizations/BarGraph/internal/BarSeries';
import FocusWindow from 'components/ui/visualizations/BarGraph/internal/FocusWindow';
import LayeredAxis from 'components/ui/visualizations/BarGraph/internal/LayeredAxis';
import MetricAxis from 'components/ui/visualizations/common/MetricAxis';
import ResponsiveContainer from 'components/ui/visualizations/common/ResponsiveContainer';
import RotatedMetricAxis from 'components/ui/visualizations/BarGraph/internal/RotatedMetricAxis';
import buildYScale from 'components/ui/visualizations/BarGraph/internal/buildYScale';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import { DEFAULT_THEME } from 'components/ui/visualizations/BarGraph/defaults';
import { autobind, memoizeOne } from 'decorators';
import { createGoalLineObject } from 'components/ui/visualizations/BarGraph/internal/createGoalLineObject';
import { objKeyEq } from 'util/objUtil';
import type {
  AxisRanges,
  BarGraphTheme,
  DataPoint,
  DimensionID,
  Metric,
  ScaleMap,
} from 'components/ui/visualizations/BarGraph/types';
import type { ChartSize, HoverPoint } from 'components/ui/visualizations/types';
import type {
  GoalLineData,
  YAxisID,
} from 'components/ui/visualizations/common/MetricAxis/types';
import type {
  LayerData,
  LayerValue,
  LevelSpec,
  LinearScale,
} from 'components/ui/visualizations/BarGraph/internal/LayeredAxis/types';

type BandScale = $FlowTODO;

type DefaultProps = {
  /** The accessibility name for this bar graph. Defaults to 'Bar chart'. */
  ariaName?: string,
  axisRanges: AxisRanges | void,
  axisTitles: {
    xAxis: string,
    y1Axis: string,
    y2Axis: string,
  },

  /**
   * How the bar graph should be layed out on screen.
   * - `vertical`: Each bar will be drawn vertically, in a column chart style.
   *               The x-axis will be on the bottom of the visualization. The
   *               y1-axis will be on the left side of the visualization, and
   *               the y2-axis (if in use) will be on the right.
   * - `horizontal`: Each bar will be drawn horizontally. The x-axis will be on
   *                 the left side of the visualization. The y1-axis will be on
   *                 the bottom, and the y2-axis (if in use) will be on the top.
   */
  barDirection: 'horizontal' | 'vertical',

  /**
   * How the bars should be laid out on the screen.
   * - `overlaid`: Each bar will be drawn on top of the previous bar with the
   *               full width. The tallest bar will be drawn first, then the
   *               second-tallest, and so on. Each bar will be drawn with
   *               opacity so it is possible to see the height despite drawing
   *               in the same space.
   * - `overlapping`: Each bar will be drawn on top of the previous bar and will
   *                  have a smaller width.
   * - `sequential`: Each bar will be drawn directly after the previous bar.
   * - `stacked`: Each bar will be drawn above the previous bar. The y-value of
   *              the full stacked bar will be the sum of each bar in the stack.
   */
  barTreatment: 'overlaid' | 'overlapping' | 'sequential' | 'stacked',

  /**
   * The default maximum number of bar groups that should be shown when the
   * chart is initialized. If this value changes, the focus window will be
   * reset to the beginning and show the selected number of bar groups. If
   * set to a value less than zero, all bar groups will be shown.
   */
  defaultVisibleBarGroups: number,

  /**
   * Convert a dimension ID into the full dimension display name.
   */
  dimensionFormatter: (dimensionID: DimensionID) => string,

  /**
   * Convert a raw value for a given dimension into a displayable value.
   */
  dimensionValueFormatter: (
    dimensionID: DimensionID,
    value: string | null,
  ) => string,

  /**
   * When enabled, the only the visible bars (determined by the current focus
   * focus selection) will dictate the height of the rendered bars. When
   * disabled, the height will be determined from all bars. If the user has
   * entered an axis range, that will be used over this.
   */
  dynamicBarHeight: boolean,
  enableFocusWindow: boolean,
  theme: BarGraphTheme,
};

type Props = {
  ...DefaultProps,
  dataPoints: $ReadOnlyArray<DataPoint>,
  height: number,

  goalLines: $ReadOnlyArray<GoalLineData>,

  /**
   * Ordered list of bar groupings specifying how the bars should be sorted and
   * by which fields. The order is from least specific (the outer level) to the
   * most specific (the final group that holds just a single set of bars).
   */
  levels: $ReadOnlyArray<LevelSpec>,
  metricOrder: $ReadOnlyArray<Metric>,
  width: number,
  onGoalLineChange: (goalLines: $ReadOnlyArray<GoalLineData>) => void,
  ...
};

type State = {
  dragging: boolean,
  focusPosition: {
    end: number,
    start: number,
  },
  hoverData: {
    dataPoint: DataPoint,
    metric: Metric,
    point: HoverPoint,
  } | void,
  hoverLine: GoalLineData | void,
  innerChartSize: ChartSize,

  // NOTE(stephen): Would be nice to have a Zen.Set here.
  selectedDimensionValues: Zen.Map<Set<string | null>>,
};

const EMPTY_SET: Set<string | null> = new Set();

const CONTAINER_STYLE = {
  position: 'relative',
};

// NOTE(stephen): Need to use `display: block` on the focus window SVG to ensure
// that it is positioned and sized properly after the responsive bar graph.
const FOCUS_STYLE = {
  display: 'block',
  overflow: 'visible',
};

// NOTE(stephen): Need to apply `display: block` to the root SVG when in
// horizontal bar since the ResponsiveContainer is not handling it for us.
const HORIZONTAL_CONTAINER_STYLE = {
  display: 'block',
};

function _buildLayerValue(
  layerDimensions: $ReadOnlyArray<DimensionID>,
  dataPoint: DataPoint,
  key: string,
): LayerValue {
  const output: LayerValue = { key };
  layerDimensions.forEach((dimensionID: DimensionID) => {
    output[dimensionID] = dataPoint.dimensions[dimensionID];
  });
  return output;
}

// Compute the minimum and maximum values that will be displayed on each
// y-axis. Ensure the goal line values that are set for each axis are included
// in the range calculation.
function buildYScales(
  dataPoints: $ReadOnlyArray<DataPoint>,
  metricOrder: $ReadOnlyArray<Metric>,
  goalLines: $ReadOnlyArray<GoalLineData>,
  height: number,
  stack: boolean,
  axisRanges: AxisRanges | void,
): [LinearScale | void, LinearScale | void] {
  const y1 = {
    initialMax: 0,
    initialMin: 0,
  };
  const y2 = {
    initialMax: 0,
    initialMin: 0,
  };

  // Include the goal line values currently set to ensure the axis that is
  // created includes their values. Without this, a goal line that is set larger
  // than the biggest data point will not be visible.
  goalLines.forEach(({ axis, value }) => {
    const axisData = axis === 'y1Axis' ? y1 : y2;
    axisData.initialMin = Math.min(axisData.initialMin, value);
    axisData.initialMax = Math.max(axisData.initialMax, value);
  });

  const yScales = {
    y1: buildYScale(
      dataPoints,
      metricOrder.filter(({ axis }) => axis === 'y1Axis'),
      height,
      stack,
      y1.initialMin,
      y1.initialMax,
    ),
    y2: buildYScale(
      dataPoints,
      metricOrder.filter(({ axis }) => axis === 'y2Axis'),
      height,
      stack,
      y2.initialMin,
      y2.initialMax,
    ),
  };

  // If the user has set the range, override the values set by buildYScale.
  if (axisRanges !== undefined) {
    Object.keys(axisRanges).forEach(axis => {
      const yScale = axis === 'y1Axis' ? yScales.y1 : yScales.y2;
      if (yScale === undefined) {
        return;
      }

      const { max, min } = axisRanges[axis];
      const domain = yScale.domain();

      // Modify the scale's domain *in-place* with the overridden values (if they
      // exist).
      yScale.domain([
        min !== undefined && min !== null ? min : domain[0],
        max !== undefined && max !== null ? max : domain[1],
      ]);
    });
  }

  return [yScales.y1, yScales.y2];
}

const TEXT = t('ui.visualizations.BarGraph');

export default class BarGraph extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    ariaName: TEXT.title,
    axisRanges: undefined,
    axisTitles: {
      xAxis: '',
      y1Axis: '',
      y2Axis: '',
    },
    barDirection: 'vertical',
    barTreatment: 'sequential',
    defaultVisibleBarGroups: 50,
    dimensionFormatter: (dimensionID: DimensionID) => dimensionID,
    dimensionValueFormatter: (dimensionID: DimensionID, value: string | null) =>
      value === null ? 'null' : value,
    dynamicBarHeight: false,
    enableFocusWindow: true,
    theme: DEFAULT_THEME,
  };

  state: State = {
    dragging: false,
    focusPosition: {
      end: 0,
      start: 0,
    },
    hoverData: undefined,
    hoverLine: undefined,
    innerChartSize: {
      height: 10,
      width: 10,
    },
    selectedDimensionValues: Zen.Map.create(),
  };

  // NOTE(stephen): The clip path ID *must be unique*. If the BarGraph component
  // is loaded multiple times on the same page, and each clip-path shares the
  // same ID, then it is possible for the wrong clipPath to get used. This
  // results in improper clipping.
  +clipPathId: string = `inner-chart-clip--${+new Date()}`;

  componentDidUpdate(prevProps: Props) {
    const { defaultVisibleBarGroups } = this.props;
    if (prevProps.defaultVisibleBarGroups !== defaultVisibleBarGroups) {
      this.setState(({ innerChartSize }) => ({
        focusPosition: this.buildInitialFocusPosition(innerChartSize.width),
      }));
    }
  }

  @memoizeOne
  buildSortedDataPoints(
    dataPoints: $ReadOnlyArray<DataPoint>,
    levels: $ReadOnlyArray<LevelSpec>,
  ): $ReadOnlyArray<DataPoint> {
    return dataPoints.slice().sort((a: DataPoint, b: DataPoint) => {
      let sortResult = 0;

      levels.every(({ comparator }: LevelSpec) => {
        sortResult = comparator(a, b);
        return sortResult === 0;
      });
      return sortResult;
    });
  }

  getSortedDataPoints(): $ReadOnlyArray<DataPoint> {
    const { dataPoints, levels } = this.props;
    return this.buildSortedDataPoints(dataPoints, levels);
  }

  @memoizeOne
  buildVisibleDataPoints(
    sortedDataPoints: $ReadOnlyArray<DataPoint>,
    barGroupScale: BandScale,
    width: number,
  ): $ReadOnlyArray<DataPoint> {
    const groupStep = barGroupScale.step();
    return sortedDataPoints.filter(dataPoint => {
      // NOTE(stephen): Slightly unsafe access of `this` property inside
      // memoized method, however the chain should be invalidated if
      // `sortedDataPoints` changes so we should be ok.
      const key = this.getDataPointKey(dataPoint);
      const groupStart = barGroupScale(key);
      const groupEnd = groupStart + groupStep;
      return groupEnd > 0 && groupEnd < width;
    });
  }

  getVisibleDataPoints(): $ReadOnlyArray<DataPoint> {
    return this.buildVisibleDataPoints(
      this.getSortedDataPoints(),
      this.getBarGroupScale(),
      this.getVisibleXAxisWidth(),
    );
  }

  /**
   * Build the scale that determines how individual bars within a group are
   * laid out.
   */
  @memoizeOne
  buildInnerGroupScale(
    metricOrder: $ReadOnlyArray<Metric>,
    padding: number,
    groupWidth: number,
  ): BandScale {
    return scaleBand({
      domain: metricOrder
        .filter(m => m.visualDisplayShape === 'bar')
        .map(({ id }) => id),
      padding,
      range: [0, groupWidth],
    });
  }

  @memoizeOne
  buildFocusInnerGroupScale(
    metricOrder: $ReadOnlyArray<Metric>,
    padding: number,
    groupWidth: number,
  ): BandScale {
    return scaleBand({
      domain: metricOrder
        .filter(m => m.visualDisplayShape === 'bar')
        .map(({ id }) => id),
      padding,
      range: [0, groupWidth],
      round: false,
    });
  }

  getInnerGroupScale(): BandScale {
    const { metricOrder, theme } = this.props;
    return this.buildInnerGroupScale(
      metricOrder,
      theme.innerBarPadding,
      this.getBarGroupScale().bandwidth(),
    );
  }

  /**
   * Build the scale that will determine how a group of bars should be laid out.
   */
  @memoizeOne
  buildBarGroupScale(
    dataPointKeyMap: Map<DataPoint, string>,
    groupPadding: number,
    start: number,
    end: number,
  ): BandScale {
    return scaleBand({
      domain: Array.from(dataPointKeyMap.values()),
      padding: groupPadding,
      range: [start, end],
    });
  }

  @memoizeOne
  buildFocusBarGroupScale(
    dataPointKeyMap: Map<DataPoint, string>,
    groupPadding: number,
    width: number,
  ): BandScale {
    return scaleBand({
      domain: Array.from(dataPointKeyMap.values()),
      padding: groupPadding,
      range: [0, width],
      round: false,
    });
  }

  getBarGroupScale(): BandScale {
    const { focusPosition, innerChartSize } = this.state;
    const { start, end } = focusPosition;
    const focusWidth = end - start;
    const scale = focusWidth > 0 ? innerChartSize.width / focusWidth : 1;
    const scaledWidth = scale * innerChartSize.width;
    const offsetStart = -start * scale;
    const offsetEnd = offsetStart + scaledWidth;
    return this.buildBarGroupScale(
      this.getDataPointKeyMap(),
      this.props.theme.groupPadding,
      offsetStart,
      offsetEnd,
    );
  }

  /**
   * When any bar values are being displayed, we need to introduce a placeholder
   * top axis to ensure the bar values do not get cut off.
   */
  @memoizeOne
  buildAxisTopHeight(
    metricOrder: $ReadOnlyArray<Metric>,
    y1Scale: LinearScale | void,
    y2Scale: LinearScale | void,
    barDirection: 'horizontal' | 'vertical',
  ): number {
    if (y1Scale === undefined && y2Scale === undefined) {
      return 0;
    }

    // Find the longest possible bar value based on the y-axis range.
    // HACK(stephen): Implement a simple heuristic to try and minimize the
    // amount of padding that is needed, based on the length of the largest
    // value being displayed.
    const y1Max = y1Scale !== undefined ? y1Scale.domain()[1] : 0;
    const y2Max = y2Scale !== undefined ? y2Scale.domain()[1] : 0;

    // If the bars are displayed horizontally then the y-axis labels will also
    // be horizontal. When this happens, we need to ensure their values don't
    // get cut off as well.
    const isHorizontal = barDirection === 'horizontal';
    const maxValueLength = metricOrder.reduce((curMax, metric) => {
      if (!metric.showValue && !isHorizontal) {
        return curMax;
      }

      // Format the largest value for each axis with the metric formatter.
      // NOTE(stephen): Since we don't know which metric has the largest value,
      // we can't use the specific metric formatter for that value. By using
      // every formatter, we can at least guarantee we provide enough space,
      // even if we might overcalculate a bit.
      // NOTE(stephen): We could directly calculate it by finding the max value
      // for each bar with a value being shown, but that seemed like overkill.
      // It would need to account for stacked bars, and could potentially be
      // costly having to loop over all values each time a metric settings
      // changes.
      const formattedValue =
        metric.axis === 'y1Axis'
          ? metric.formatValue(y1Max)
          : metric.formatValue(y2Max);

      // HACK(stephen): The only reason we would store the value length if the
      // metric is *not* being shown is if the bar graph is in horizontal mode.
      // When this happens, the final y-axis tick value is centered over the
      // last tick. If the metric value is not being shown, we want to compute
      // roughly where this final tick will end up on the y-axis. Since the
      // value is centered, we divide by 2 to get the amount that the label will
      // overflow past the tick mark.
      const valueLength = metric.showValue
        ? `${formattedValue}`.length
        : `${formattedValue}`.length / 2;
      return Math.max(valueLength, curMax);
    }, 0);

    // If no bars have a value being displayed, the max will be 0.
    if (maxValueLength === 0) {
      return 0;
    }

    // TODO(stephen): When value font size is implemented, we will need a better
    // way to calculate this. Right now it is just an approximation based on
    // hand tested values.
    return 10 + 5 * maxValueLength;
  }

  getAxisTopHeight(): number {
    const { barDirection, metricOrder } = this.props;
    const { y1Scale, y2Scale } = this.getScales();
    return this.buildAxisTopHeight(metricOrder, y1Scale, y2Scale, barDirection);
  }

  /**
   * Build the full width that bars can be rendered to. This can be larger than
   * the visualization width since we want to enforce a minimum bar width and
   * not all bars can fit inside the panel with this constraint. The user will
   * then be able to pan to adjust which bars are in view.
   */
  getFullXAxisWidth(): number {
    const { defaultVisibleBarGroups } = this.props;
    const barGroupCount = this.getSortedDataPoints().length;
    const visibleWidth = this.getVisibleXAxisWidth();

    // If the default visible bar group count is negative, we should show all
    // bars.
    if (defaultVisibleBarGroups < 0) {
      return visibleWidth * barGroupCount;
    }

    return Math.max(
      visibleWidth,
      (visibleWidth * barGroupCount) / this.props.defaultVisibleBarGroups,
    );
  }

  usingFocusWindow(): boolean {
    const { enableFocusWindow, defaultVisibleBarGroups } = this.props;

    // NOTE(stephen): Right now, the horizontal bar chart cannot use the focus
    // window.
    if (!enableFocusWindow || !this.isColumnChart()) {
      return false;
    }

    const barGroupCount = this.getSortedDataPoints().length;
    return barGroupCount > defaultVisibleBarGroups;
  }

  getFocusWindowHeight(): number {
    if (!this.usingFocusWindow()) {
      return 0;
    }

    return this.props.theme.focus.height;
  }

  /**
   * This is the visible width that can be seen by the user at any time.
   */
  getVisibleXAxisWidth(): number {
    return this.state.innerChartSize.width;
  }

  getYAxisHeight(): number {
    return this.state.innerChartSize.height;
  }

  @memoizeOne
  buildChartYScales(
    dataPoints: $ReadOnlyArray<DataPoint>,
    metricOrder: $ReadOnlyArray<Metric>,
    goalLines: $ReadOnlyArray<GoalLineData>,
    height: number,
    stack: boolean,
    axisRanges: AxisRanges | void,
  ): [LinearScale | void, LinearScale | void] {
    return buildYScales(
      dataPoints,
      metricOrder,
      goalLines,
      height,
      stack,
      axisRanges,
    );
  }

  @memoizeOne
  buildFocusChartYScales(
    dataPoints: $ReadOnlyArray<DataPoint>,
    metricOrder: $ReadOnlyArray<Metric>,
    height: number,
    stack: boolean,
    axisRanges: AxisRanges | void,
  ): [LinearScale | void, LinearScale | void] {
    return buildYScales(dataPoints, metricOrder, [], height, stack, axisRanges);
  }

  @memoizeOne
  buildScaleMap(
    barScale: BandScale,
    barGroupScale: BandScale,
    y1Scale: LinearScale | void,
    y2Scale: LinearScale | void,
  ): ScaleMap {
    return { barScale, barGroupScale, y1Scale, y2Scale };
  }

  getScales(): ScaleMap {
    const {
      axisRanges,
      barTreatment,
      dynamicBarHeight,
      goalLines,
      metricOrder,
    } = this.props;
    const dataPoints =
      dynamicBarHeight && this.usingFocusWindow()
        ? this.getVisibleDataPoints()
        : this.getSortedDataPoints();
    return this.buildScaleMap(
      this.getInnerGroupScale(),
      this.getBarGroupScale(),
      ...this.buildChartYScales(
        dataPoints,
        metricOrder,
        goalLines,
        this.getYAxisHeight(),
        barTreatment === 'stacked',
        axisRanges,
      ),
    );
  }

  @memoizeOne
  buildFocusScaleMap(
    barScale: BandScale,
    barGroupScale: BandScale,
    y1Scale: LinearScale | void,
    y2Scale: LinearScale | void,
  ): ScaleMap {
    return { barScale, barGroupScale, y1Scale, y2Scale };
  }

  getFocusScales(): ScaleMap {
    const { axisRanges, barTreatment, metricOrder, theme } = this.props;
    const barGroupScale = this.buildFocusBarGroupScale(
      this.getDataPointKeyMap(),
      theme.groupPadding,
      this.getVisibleXAxisWidth(),
    );
    const barScale = this.buildFocusInnerGroupScale(
      metricOrder,
      theme.innerBarPadding,
      barGroupScale.bandwidth(),
    );
    return this.buildFocusScaleMap(
      barScale,
      barGroupScale,
      ...this.buildFocusChartYScales(
        this.getSortedDataPoints(),
        metricOrder,
        this.getFocusWindowHeight(),
        barTreatment === 'stacked',
        axisRanges,
      ),
    );
  }

  /**
   * Build a mapping from a data point object to an immutable key representing
   * that point.
   */
  @memoizeOne
  buildDataPointKeyMap(
    dataPoints: $ReadOnlyArray<DataPoint>,
    levels: $ReadOnlyArray<LevelSpec>,
  ): Map<DataPoint, string> {
    const output: Map<DataPoint, string> = new Map();
    dataPoints.forEach((dataPoint: DataPoint) => {
      const key = levels
        .map(
          ({ dimensionID }: LevelSpec) =>
            dataPoint.dimensions[dimensionID] || '',
        )
        .join('__');
      output.set(dataPoint, key);
    });

    return output;
  }

  getDataPointKeyMap(): Map<DataPoint, string> {
    return this.buildDataPointKeyMap(
      this.getSortedDataPoints(),
      this.props.levels,
    );
  }

  getDataPointKey(dataPoint: DataPoint): string {
    const key = this.getDataPointKeyMap().get(dataPoint);
    invariant(key !== undefined, 'All datapoints will have a generated key');
    return key;
  }

  @memoizeOne
  buildAxisLayers(
    levels: $ReadOnlyArray<LevelSpec>,
    sortedDataPoints: $ReadOnlyArray<DataPoint>,
    dataPointKeyMap: Map<DataPoint, string>,
    axisTheme: $PropertyType<$PropertyType<BarGraphTheme, 'axis'>, 'xAxis'>,
    barDirection: 'horizontal' | 'vertical',
    // eslint-disable-next-line no-unused-vars
    selectedDimensionValues: Zen.Map<Set<string | null>>,
  ): $ReadOnlyArray<LayerData> {
    const numDataPoints = sortedDataPoints.length;
    if (numDataPoints === 0) {
      return [];
    }

    const currentDimensions = [];

    // If this is a horizontal bar chart, we need to rotate the labels since the
    // entire chart is rotated 90 degrees from its normal column orientation.
    const rotateAll = barDirection === 'horizontal';
    return levels.map(level => {
      currentDimensions.push(level.dimensionID);
      const layerValues = [];
      let curLayerValue;
      sortedDataPoints.forEach(dataPoint => {
        if (
          curLayerValue === undefined ||
          !objKeyEq(dataPoint.dimensions, curLayerValue, currentDimensions)
        ) {
          const key = dataPointKeyMap.get(dataPoint);
          invariant(key !== undefined, 'All DataPoints will have a key');
          curLayerValue = _buildLayerValue(currentDimensions, dataPoint, key);
          layerValues.push(curLayerValue);
        }
      });

      return {
        angle: rotateAll ? 'vertical' : level.angle,
        layerDimensions: currentDimensions.slice(),
        layerValues,
      };
    });
  }

  getAxisLayers(): $ReadOnlyArray<LayerData> {
    const { barDirection, levels, theme } = this.props;

    // HACK(stephen): Passing in `selectedDimensionValues` even though it is
    // unused because we need a way to trigger a component change in a deeply
    // nested PureComponent (CollisionAvoidantAxis). The simplest way to trigger
    // the update (from what I've found) is to rebuild the axis layers object.
    return this.buildAxisLayers(
      levels,
      this.getSortedDataPoints(),
      this.getDataPointKeyMap(),
      theme.axis.xAxis,
      barDirection,
      this.state.selectedDimensionValues,
    );
  }

  isSelected(dimensionValues: { +[DimensionID]: string | null, ... }): boolean {
    const { selectedDimensionValues } = this.state;

    return (
      !selectedDimensionValues.isEmpty() &&
      selectedDimensionValues
        .entries()
        .every(([dimensionID, selectedValues]) =>
          selectedValues.has(dimensionValues[dimensionID]),
        )
    );
  }

  /**
   * Calculate the focus window position so that the number of bars displayed
   * matches the default selected number of bars.
   */
  buildInitialFocusPosition(width: number): { end: number, start: number } {
    // If no minimum bar group count is set, show the full result.
    const { defaultVisibleBarGroups } = this.props;
    if (defaultVisibleBarGroups <= 0) {
      return { end: width, start: 0 };
    }

    const dataPointCount = this.getSortedDataPoints().length;
    const end = Math.min(
      width,
      (width * defaultVisibleBarGroups) / dataPointCount,
    );
    return { end, start: 0 };
  }

  @autobind
  getBarGroupOpacity(dataPoint: DataPoint): number {
    const { barTreatment, metricOrder } = this.props;
    const { selectedDimensionValues } = this.state;
    // The bar should have full color unless it there are no bars selected or
    // if this is one of the bars selected.
    const fullColor =
      selectedDimensionValues.isEmpty() ||
      this.isSelected(dataPoint.dimensions);

    // The overlaid bar treatment must always use opaque bars when there is more
    // than 1 metric.
    if (barTreatment === 'overlaid' && metricOrder.length > 1) {
      return fullColor ? 0.5 : 0.25;
    }

    return fullColor ? 1 : 0.25;
  }

  @autobind
  tickLabelProps(
    layerValue: LayerValue,
  ): {| fontWeight?: 'bold' | number, cursor?: string |} {
    const output = {
      ...this.props.theme.axis.xAxis.ticks.label,
      cursor: 'pointer',
      fontWeight: 500,
    };

    if (this.isSelected(layerValue)) {
      output.fontWeight = 700;
    }

    return output;
  }

  @memoizeOne
  buildXAxisValueFormatter(
    dimensionValueFormatter: $PropertyType<Props, 'dimensionValueFormatter'>,
    maxInnerLayerTextLength: number | void,
  ): (
    layerValue: LayerValue,
    layerDimensions: $ReadOnlyArray<DimensionID>,
  ) => string {
    return (layerValue, layerDimensions) => {
      const dimensionID = layerDimensions[layerDimensions.length - 1];
      const rawValue = layerValue[dimensionID];
      if (rawValue === undefined) {
        return '';
      }

      const value = dimensionValueFormatter(dimensionID, rawValue);

      // Truncate the axis value if we are on an inner layer and the user's theme
      // calls for the inner layer text to be truncated.
      if (
        maxInnerLayerTextLength !== undefined &&
        layerDimensions.length > 1 &&
        value.length > maxInnerLayerTextLength
      ) {
        return `${value.substr(0, maxInnerLayerTextLength).trim()}...`;
      }

      return value;
    };
  }

  @memoizeOne
  buildY1AxisGoalLines(
    goalLines: $ReadOnlyArray<GoalLineData>,
  ): $ReadOnlyArray<GoalLineData> {
    return goalLines.filter(data => data.axis === 'y1Axis');
  }

  @memoizeOne
  buildY2AxisGoalLines(
    goalLines: $ReadOnlyArray<GoalLineData>,
  ): $ReadOnlyArray<GoalLineData> {
    return goalLines.filter(data => data.axis === 'y2Axis');
  }

  isColumnChart(): boolean {
    return this.props.barDirection === 'vertical';
  }

  @autobind
  onAxisValueClick(
    layerValue: LayerValue,
    layerDimensions: $ReadOnlyArray<DimensionID>,
  ) {
    const dimensionID = layerDimensions[layerDimensions.length - 1];
    const value = layerValue[dimensionID];
    this.setState(({ selectedDimensionValues }) => {
      const selectedValues = new Set(
        selectedDimensionValues.get(dimensionID, EMPTY_SET),
      );

      if (selectedValues.has(value)) {
        // If we are deselecting the last element for this dimension, remove the
        // dimension completely from the map.
        if (selectedValues.size === 1) {
          return {
            selectedDimensionValues: selectedDimensionValues.delete(
              dimensionID,
            ),
          };
        }

        selectedValues.delete(value);
      } else {
        selectedValues.add(value);
      }

      return {
        selectedDimensionValues: selectedDimensionValues.set(
          dimensionID,
          selectedValues,
        ),
      };
    });
  }

  @autobind
  onHoverStart(
    dataPoint: DataPoint,
    metric: Metric,
    event: SyntheticMouseEvent<SVGElement>,
  ) {
    const { offsetX, offsetY } = event.nativeEvent;
    this.setState({
      hoverData: {
        dataPoint,
        metric,
        point: {
          x: offsetX,
          y: offsetY,
        },
      },
    });
  }

  @autobind
  onHoverEnd() {
    this.setState({ hoverData: undefined });
  }

  @autobind
  onY1AxisHoverMove(value: number) {
    this.onYAxisHoverMove('y1Axis', value);
  }

  @autobind
  onY2AxisHoverMove(value: number) {
    this.onYAxisHoverMove('y2Axis', value);
  }

  @autobind
  onYAxisHoverMove(axis: YAxisID, value: number) {
    const hoverLine = createGoalLineObject({ axis, id: 'hover', value });
    this.setState({ hoverLine });
  }

  @autobind
  onYAxisHoverEnd() {
    this.setState({ hoverLine: undefined });
  }

  /**
   * HACK(yitian): We want to round values so that they display nicely on
   * the goal line control but we only round if the value is an integer. This
   * logic exists in MetricAxis, so we we define a round parameter that will be
   * filled in MetricAxis and this call will be triggered in GoalLine component.
   */
  @autobind
  onGoalLineClick(goalLineID: string, roundValue: boolean) {
    const { goalLines, onGoalLineChange } = this.props;
    const { hoverLine } = this.state;

    // This should never happen, but on the off chance that somehow we clicked
    // an undefined hoverline, we return and do nothing.
    if (hoverLine === undefined) {
      return;
    }
    // If goal line ID exists in goal lines, remove. Otherwise, we know
    // this is a new goal line.
    const filtered = goalLines.filter(line => line.id !== goalLineID);
    if (filtered.length !== goalLines.length) {
      onGoalLineChange(filtered);
    } else {
      const updatedValue = roundValue
        ? Number(hoverLine.value.toFixed(2))
        : hoverLine.value;
      // Hoverline id is always 'hover'. Generate a new permanent id by overriding
      // id to undefined.
      const updatedGoalLine = createGoalLineObject({
        ...hoverLine,
        id: undefined,
        value: updatedValue,
      });
      onGoalLineChange([...goalLines, updatedGoalLine]);
    }
  }

  @autobind
  onFocusAreaChange(start: number, end: number) {
    this.setState({ focusPosition: { start, end } });
  }

  @autobind
  onFocusDragStart() {
    this.setState({ dragging: true });
  }

  @autobind
  onFocusDragStop() {
    this.setState({ dragging: false });
  }

  @autobind
  onInnerChartResize(height: number, width: number) {
    this.setState(prevState => {
      const prevWidth = prevState.innerChartSize.width;
      const prevHeight = prevState.innerChartSize.height;
      if (prevWidth === width && prevHeight === height) {
        return prevState;
      }

      // HACK(stephen): COME BACK TO THIS HACK HACK HACK
      // If we are transitioning from a chart with 0 width to a chart with a
      // positive width, reset the focus window position.
      const innerChartSize = { height, width };

      // HACK(stephen): The chart has a nonzero initial size. paramaterize this.
      if (prevWidth <= 10 && width > 10) {
        const focusPosition = this.buildInitialFocusPosition(width);
        return {
          focusPosition,
          innerChartSize,
        };
      }

      const newState: $Shape<State> = { innerChartSize };

      // If the chart width changes, we should adjust the focusPosition's bounds
      // to ensure the same bars are shown as the previous width. If we don't
      // adjust it, then the focusPosition's start/end are based on the previous
      // chart's width and the next render will change the visible bars shown.
      // When the y-axis is dynamically tied to the focus window's visible bars,
      // then we can run into an error where the chart could oscillate between
      // two widths. This is caused by the focusPosition staying the same after
      // the y-axis has changed widths, which then causes an inner chart resize
      // which then causes a different set of bars to be shown (because the
      // focusPosition is unchanged) which then causes the y-axis to get larger
      // (because the visible bars changes) which then triggers an inner chart
      // resize which then causes the y-axis to get smaller (because the visible
      // bars changes again). This repeats until the user moves the focus
      // window.
      if (prevWidth !== width) {
        const scale = width / prevWidth;
        newState.focusPosition = {
          end: prevState.focusPosition.end * scale,
          start: prevState.focusPosition.start * scale,
        };
      }

      return newState;
    });
  }

  maybeRenderTooltip(): React.Node {
    const { hoverData } = this.state;
    if (!hoverData) {
      return null;
    }

    const { dimensionFormatter, dimensionValueFormatter } = this.props;
    const { dataPoint, metric, point } = hoverData;
    return (
      <BarGraphTooltip
        dataPoint={dataPoint}
        dimensionFormatter={dimensionFormatter}
        dimensionValueFormatter={dimensionValueFormatter}
        metric={metric}
        point={point}
      />
    );
  }

  @autobind
  maybeRenderY1Axis(
    innerRef: (React.ElementRef<'g'> | null) => void,
  ): React.MixedElement | null {
    const { axisTitles, goalLines, metricOrder, theme } = this.props;
    const { hoverLine } = this.state;
    const { y1Scale } = this.getScales();
    const metric = metricOrder.find(m => m.axis === 'y1Axis');

    if (y1Scale === undefined || metric === undefined) {
      return null;
    }

    const axisHoverLine =
      hoverLine !== undefined && hoverLine.axis === 'y1Axis'
        ? hoverLine
        : undefined;
    const axisTheme = theme.axis.y1Axis;
    const axisGoalLines = this.buildY1AxisGoalLines(goalLines);
    const AxisComponent = this.isColumnChart() ? MetricAxis : RotatedMetricAxis;
    return (
      <AxisComponent
        axisOrientation="left"
        chartWidth={this.getVisibleXAxisWidth()}
        formatValue={metric.formatValue}
        goalLineThemes={theme.goalLine}
        goalLines={axisGoalLines}
        height={this.getYAxisHeight()}
        hoverLine={axisHoverLine}
        innerRef={innerRef}
        onGoalLineClick={this.onGoalLineClick}
        onHoverMove={this.onY1AxisHoverMove}
        onHoverEnd={this.onYAxisHoverEnd}
        stroke={axisTheme.stroke}
        tickColor={axisTheme.ticks.color}
        tickLabelProps={axisTheme.ticks.label}
        title={axisTitles.y1Axis}
        titleLabelProps={axisTheme.title}
        yScale={y1Scale}
      />
    );
  }

  @autobind
  maybeRenderY2Axis(
    innerRef: (React.ElementRef<'g'> | null) => void,
  ): React.MixedElement | null {
    const { axisTitles, goalLines, metricOrder, theme } = this.props;
    const { hoverLine } = this.state;
    const { y2Scale } = this.getScales();
    const metric = metricOrder.find(m => m.axis === 'y2Axis');

    if (y2Scale === undefined || metric === undefined) {
      return null;
    }

    const axisHoverLine =
      hoverLine !== undefined && hoverLine.axis === 'y2Axis'
        ? hoverLine
        : undefined;
    const axisTheme = theme.axis.y2Axis;
    const axisGoalLines = this.buildY2AxisGoalLines(goalLines);
    const AxisComponent = this.isColumnChart() ? MetricAxis : RotatedMetricAxis;
    return (
      <AxisComponent
        axisOrientation="right"
        chartWidth={this.getVisibleXAxisWidth()}
        formatValue={metric.formatValue}
        goalLineThemes={theme.goalLine}
        goalLines={axisGoalLines}
        height={this.getYAxisHeight()}
        hoverLine={axisHoverLine}
        innerRef={innerRef}
        onGoalLineClick={this.onGoalLineClick}
        onHoverMove={this.onY2AxisHoverMove}
        onHoverEnd={this.onYAxisHoverEnd}
        stroke={axisTheme.stroke}
        tickColor={axisTheme.ticks.color}
        tickLabelProps={axisTheme.ticks.label}
        title={axisTitles.y2Axis}
        titleLabelProps={axisTheme.title}
        yScale={y2Scale}
      />
    );
  }

  maybeRenderFocus(): React.Node {
    const height = this.getFocusWindowHeight();
    if (!this.usingFocusWindow() || height === 0) {
      return null;
    }

    const {
      barDirection,
      barTreatment,
      metricOrder,
      theme,
      width: containerWidth,
    } = this.props;

    const width = this.getVisibleXAxisWidth();
    const { start, end } = this.state.focusPosition;

    const dataPoints = this.getSortedDataPoints();
    const scales = this.getFocusScales();

    // Only show the bars in the focus window if they will actually be visible
    // and useful. If there are too many bars, or if the bars would be rendered
    // too small, then they are not useful and we should not show them. This
    // helps improve performance when the visualization has a lot of data.
    // NOTE(stephen): The `bandwidth` of the bar scale is the width that each
    // bar will occupy on the page in pixels. If this width is less than 1 pixel
    // then it will be very difficult for the user to get meaningful information
    // from the focus window.
    // NOTE(stephen): When we hide the bars, we will draw a gray box along the
    // bottom of the focus window to remind the user that the focus window still
    // operates across the whole bar chart. This gray box is basically what the
    // user would have seen anyways with a large number of points and a tiny bar
    // size.
    const hideBars =
      dataPoints.length * metricOrder.length > 10000 ||
      scales.barScale.bandwidth() < 1;

    // HACK(stephen): Since we are rendering the FocusWindow outside of the
    // ResponsiveContainer, we don't have access to the left/right axis sizes
    // to properly offset the window. Try to guess the best offsets for the
    // focus window so it is positioned directly under the bars.
    const { y1Scale, y2Scale } = this.getScales();
    const extraSpace = Math.max(containerWidth - width, 0);
    let marginLeft = 0;
    if (y1Scale !== undefined && y2Scale !== undefined) {
      // Center the focus window if both y-axes are in use.
      marginLeft = extraSpace / 2;
    } else if (y1Scale !== undefined) {
      // Align the focus window to the right if only the y1Axis is in use.
      marginLeft = extraSpace;
    }

    return (
      <svg height={height} style={FOCUS_STYLE} width={containerWidth}>
        <g transform={`translate(${marginLeft}, 0)`}>
          <FocusWindow
            focusEnd={end}
            focusStart={start}
            height={height}
            onDragStart={this.onFocusDragStart}
            onDragStop={this.onFocusDragStop}
            onFocusAreaChange={this.onFocusAreaChange}
            width={width}
          >
            {!hideBars && (
              <BarSeries
                barDirection={barDirection}
                barGroupOpacity={this.getBarGroupOpacity}
                barStroke={theme.stroke}
                barStrokeWidth={theme.strokeWidth}
                barTreatment={barTreatment}
                dataPointKeyMap={this.getDataPointKeyMap()}
                dataPoints={dataPoints}
                enableValueDisplay={false}
                height={height}
                metricOrder={metricOrder}
                minBarHeight={theme.minBarHeight}
                scales={scales}
                width={width}
              />
            )}
            {hideBars && (
              <rect
                fill="#c4c4c4"
                height={2}
                width={width}
                x="0"
                y={height - 2}
              />
            )}
          </FocusWindow>
        </g>
      </svg>
    );
  }

  maybeRenderXAxis(): React.Element<typeof LayeredAxis> {
    const { axisTitles, dimensionValueFormatter, height, theme } = this.props;
    const barGroupScale = this.getBarGroupScale();
    const padding = barGroupScale.step() - barGroupScale.bandwidth();
    const axisTheme = theme.axis.xAxis;
    const layers = this.getAxisLayers();
    const axisValueFormatter = this.buildXAxisValueFormatter(
      dimensionValueFormatter,
      axisTheme.maxInnerLayerTextLength,
    );
    return (
      <LayeredAxis
        axisValueFormatter={axisValueFormatter}
        groupPadding={padding}
        layers={layers}
        maxHeightSuggestion={height * 0.5}
        onAxisValueClick={this.onAxisValueClick}
        scale={this.getBarGroupScale()}
        tickColor={axisTheme.ticks.color}
        tickLabelProps={this.tickLabelProps}
        title={axisTitles.xAxis}
        titleLabelProps={axisTheme.title}
        width={this.getVisibleXAxisWidth()}
      />
    );
  }

  // HACK(stephen): It is very difficult to ensure that bar values can be
  // displayed within the chart area. To try and compensate for this limitation,
  // we introduce a top axis with a given height that will provide an area for
  // bar values to overflow into. Trying to adjust the SVG container to allow
  // overflow in certain areas proved to be very difficult, so this route is
  // preferred.
  renderAxisTop(): React.Element<'rect'> {
    return (
      <rect fill="transparent" height={this.getAxisTopHeight()} width={10} />
    );
  }

  renderInnerChart(): React.MixedElement {
    const { barDirection, barTreatment, metricOrder, theme } = this.props;
    const { innerChartSize, selectedDimensionValues } = this.state;
    const { height, width } = innerChartSize;

    // HACK(stephen): Passing `selectedDimensionValues` into the `BarSeries`
    // component so that we trigger a rerender when it changes. This is because
    // the `BarSeries` component does not know when the bar group opacity
    // has changed since it is an autobound callback.
    // HACK(stephen): Increase the height of the clip-path so that when bar
    // values are displayed, they won't be cutoff on the top of the viz.
    const axisTopHeight = this.getAxisTopHeight();
    return (
      <React.Fragment>
        <RectClipPath
          height={height + axisTopHeight}
          id={this.clipPathId}
          width={width}
          y={-axisTopHeight}
        />
        <g clipPath={`url(#${this.clipPathId})`}>
          <BarSeries
            barDirection={barDirection}
            barGroupOpacity={this.getBarGroupOpacity}
            barStroke={theme.stroke}
            barStrokeWidth={theme.strokeWidth}
            barTreatment={barTreatment}
            dataPointKeyMap={this.getDataPointKeyMap()}
            dataPoints={this.getSortedDataPoints()}
            height={height}
            hideOverflowing
            metricOrder={metricOrder}
            minBarHeight={theme.minBarHeight}
            onHoverEnd={this.onHoverEnd}
            onHoverStart={this.onHoverStart}
            selectedDimensionValues={selectedDimensionValues}
            scales={this.getScales()}
            width={this.getVisibleXAxisWidth()}
          />
        </g>
      </React.Fragment>
    );
  }

  @autobind
  renderGraph(): React.Node {
    const { ariaName, height, width } = this.props;

    // The focus window will be rendered as a separate SVG after the main chart
    // SVG. Ensure there is space for both the main chart and the focus window.
    const containerHeight = Math.max(height - this.getFocusWindowHeight(), 10);
    const fullAriaName = normalizeARIAName(ariaName);
    if (this.isColumnChart()) {
      return (
        <ResponsiveContainer
          ariaName={fullAriaName}
          axisBottom={this.maybeRenderXAxis()}
          axisLeft={this.maybeRenderY1Axis}
          axisRight={this.maybeRenderY2Axis}
          axisTop={this.renderAxisTop()}
          chart={this.renderInnerChart()}
          disableResize={this.state.dragging}
          height={containerHeight}
          onChartResize={this.onInnerChartResize}
          width={width}
        />
      );
    }

    // When we are in horizontal bar mode, we rotate the root SVG 90 degrees.
    // This requires us to swap the width and height that the
    // ResponsiveContainer renders using and adjust where the placement of the
    // chart is after translation.
    // NOTE(stephen): We unfortunately cannot apply the `transform` directly to
    // the root ResponsiveContainer SVG because not all browsers support it. It
    // is a SVG Version 2 capability that is not supported yet by Safari. Using
    // a wrapper SVG allows us to have cross-browser compatibility.
    // Ref: T8343
    return (
      <svg
        aria-label={fullAriaName}
        height={containerHeight}
        role="figure"
        style={HORIZONTAL_CONTAINER_STYLE}
        width={width}
      >
        <g
          transform={`translate(${width}, 0) rotate(90)`}
          transform-origin="top left"
        >
          <ResponsiveContainer
            ariaName={fullAriaName}
            axisBottom={this.maybeRenderXAxis()}
            // NOTE(stephen): Flip the y-axes when the chart is in horizontal
            // bar mode since we want the Y1 axis to appear on the bottom of the
            // chart.
            axisLeft={this.maybeRenderY2Axis}
            axisRight={this.maybeRenderY1Axis}
            axisTop={this.renderAxisTop()}
            chart={this.renderInnerChart()}
            disableResize={this.state.dragging}
            height={width}
            onChartResize={this.onInnerChartResize}
            width={containerHeight}
          />
        </g>
      </svg>
    );
  }

  render(): React.Element<'div'> {
    return (
      <div style={CONTAINER_STYLE}>
        {this.renderGraph()}
        {this.maybeRenderFocus()}
        {this.maybeRenderTooltip()}
      </div>
    );
  }
}
