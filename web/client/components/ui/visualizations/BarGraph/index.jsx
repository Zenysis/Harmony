// @flow
import * as React from 'react';
import invariant from 'invariant';
import { RectClipPath } from '@vx/clip-path';
import { scaleBand, scaleLinear } from '@vx/scale';

import * as Zen from 'lib/Zen';
import BarGraphTooltip from 'components/ui/visualizations/BarGraph/internal/BarGraphTooltip';
import BarSeries from 'components/ui/visualizations/BarGraph/internal/BarSeries';
import FocusWindow from 'components/ui/visualizations/BarGraph/internal/FocusWindow';
import LayeredAxis from 'components/ui/visualizations/BarGraph/internal/LayeredAxis';
import MetricAxis, {
  getNiceTickCount,
} from 'components/ui/visualizations/BarGraph/internal/MetricAxis';
import ResponsiveContainer from 'components/ui/visualizations/ResponsiveContainer';
import { autobind, memoizeOne } from 'decorators';
import { objKeyEq } from 'util/objUtil';
import type { ChartSize, HoverPoint } from 'components/ui/visualizations/types';
import type {
  DataPoint,
  DimensionID,
  GoalLineData,
  GoalLineTheme,
  Metric,
  ScaleMap,
  YAxisID,
} from 'components/ui/visualizations/BarGraph/types';
import type {
  LayerData,
  LayerValue,
  LevelSpec,
  LinearScale,
} from 'components/ui/visualizations/BarGraph/internal/LayeredAxis/types';

type BandScale = any;

// TODO(stephen): Kind of a StyleObject type but different. Need a better type
// for this.
type LabelProps = {};
type AxisTheme = {
  ticks: {
    color: string,
    label: LabelProps,
  },
  title: LabelProps,
};

type BarGraphTheme = {
  axis: {
    xAxis: AxisTheme,
    y1Axis: AxisTheme,
    y2Axis: AxisTheme,
  },
  backgroundColor: string,
  focus: {
    activeColor: string,
    height: number,
    inactiveColor: string,
    marginTop: number,
  },
  goalLine: {
    hover: GoalLineTheme,
    placed: GoalLineTheme,
  },
  groupPadding: number,
  innerBarPadding: number,
  minBarWidth: number,
  stroke: string,
  tickColor: string,
};

type Props = ChartSize & {
  axisTitles: {
    xAxis: string,
    y1Axis: string,
    y2Axis: string,
  },

  dataPoints: $ReadOnlyArray<DataPoint>,

  /**
   * Ordered list of bar groupings specifying how the bars should be sorted and
   * by which fields. The order is from least specific (the outer level) to the
   * most specific (the final group that holds just a single set of bars).
   */
  levels: $ReadOnlyArray<LevelSpec>,
  metricOrder: $ReadOnlyArray<Metric>,

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
   * disabled, the height will be determined from all bars.
   */
  dynamicBarHeight: boolean,

  /**
   * The default maximum number of bar groups that should be shown when the
   * chart is initialized. If this value changes, the focus window will be
   * reset to the beginning and show the selected number of bar groups. If
   * set to a value less than zero, all bar groups will be shown.
   */
  defaultVisibleBarGroups: number,
  stack: boolean,
  theme: BarGraphTheme,
};

type State = {
  dragging: boolean,
  focusPosition: {
    end: number,
    start: number,
  },
  goalLines: {
    y1Axis: Zen.Array<GoalLineData>,
    y2Axis: Zen.Array<GoalLineData>,
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

export const DEFAULT_THEME = {
  axis: {
    xAxis: {
      ticks: {
        color: 'black',
        label: {},
      },
      title: {
        fill: 'black',
        fontSize: 12,
        textAnchor: 'middle',
      },
    },
    y1Axis: {
      ticks: {
        color: 'black',
        label: {
          fill: '#000000',
          pointerEvents: 'none',
          textAnchor: 'end',
          fontSize: 12,
          dx: '-0.25em',
          dy: '0.25em',
        },
      },
      title: {
        fill: 'black',
        fontSize: 12,
        textAnchor: 'middle',
      },
    },
    y2Axis: {
      ticks: {
        color: 'black',
        label: {
          fill: '#000000',
          pointerEvents: 'none',
          textAnchor: 'start',
          fontSize: 12,
          dx: '0.25em',
          dy: '0.25em',
        },
      },
      title: {
        fill: 'black',
        fontSize: 12,
        textAnchor: 'middle',
      },
    },
  },
  backgroundColor: 'white',
  focus: {
    activeColor: '#ffffff00',
    height: 30,
    inactiveColor: '#ffffffbb',
    marginTop: 10,
  },
  groupPadding: 0.2,
  innerBarPadding: 0,
  minBarWidth: 20,
  stroke: '#000000',
  tickColor: '#000000',
  goalLine: {
    hover: {
      backgroundColor: '#e3e7f1',
      lineColor: 'black',
      textStyle: {
        fill: '#293742',
        fontSize: 12,
        fontWeight: 500,
      },
    },
    placed: {
      backgroundColor: '#c6cbef',
      lineColor: 'black',
      textStyle: {
        fill: '#293742',
        fontSize: 12,
        fontWeight: 700,
      },
    },
  },
};

const EMPTY_SET: Set<string | null> = new Set();

const INNER_CHART_CLIP = 'inner-chart-clip';

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

function buildYScale({ enabled, max, min }, height): LinearScale | void {
  if (!enabled) {
    return undefined;
  }

  return scaleLinear({
    domain: [min, max],
    range: [height, 0],
  }).nice(getNiceTickCount(height));
}

// Compute the minimum and maximum values that will be displayed on each
// y-axis. Build a LinearScale that will map points within this range to
// absolute coordinates in the SVG. If the bars are being stacked, compute
// the minimum and maximum *accumulated values* for each data point and use
// that to set the scale. The values are accumulated since bars are *stacked*
// and the combined value of the stack is what should dictate the axis scale.
// This means the maximum value will be the sum of all positive values within
// the group. And the minimum value will be the sum of all negative values
// within the group.
function buildYScales(
  dataPoints: $ReadOnlyArray<DataPoint>,
  metricOrder: $ReadOnlyArray<Metric>,
  height: number,
  stack: boolean,
): [LinearScale | void, LinearScale | void] {
  const y1 = {
    max: 0,
    min: 0,
    enabled: false,

    // Convenience accumulators used when computing the total positive/negative
    // sum for an individual data point.
    stackNegativeTotal: 0,
    stackPositiveTotal: 0,
  };
  const y2 = {
    max: 0,
    min: 0,
    enabled: false,
    stackNegativeTotal: 0,
    stackPositiveTotal: 0,
  };
  const axes = [y1, y2];
  dataPoints.forEach(({ metrics }: DataPoint) => {
    metricOrder.forEach(({ axis, id }) => {
      const axisData = axis === 'y1Axis' ? y1 : y2;
      axisData.enabled = true;

      // NOTE(stephen): Even though Number.isFinite properly refines the
      // value, flow does not recognize this.
      const value = metrics[id];
      if (Number.isFinite(value) && value !== null) {
        // Accumulate the positive and negative values separately since we need
        // their *totals* when building stacked bars.
        if (stack) {
          if (value < 0) {
            axisData.stackNegativeTotal += value;
          } else {
            axisData.stackPositiveTotal += value;
          }
        } else {
          // If not stacking, store the min and max directly.
          axisData.min = Math.min(axisData.min, value);
          axisData.max = Math.max(axisData.max, value);
        }
      }
    });

    // Update the min/max for each axis and reset the accumulators.
    if (stack) {
      axes.forEach(axisData => {
        /* eslint-disable no-param-reassign */
        axisData.min = Math.min(axisData.min, axisData.stackNegativeTotal);
        axisData.max = Math.max(axisData.max, axisData.stackPositiveTotal);
        axisData.stackNegativeTotal = 0;
        axisData.stackPositiveTotal = 0;
        /* eslint-enable no-param-reassign */
      });
    }
  });

  return [buildYScale(y1, height), buildYScale(y2, height)];
}

export default class BarGraph extends React.PureComponent<Props, State> {
  static defaultProps = {
    axisTitles: {
      xAxis: '',
      y1Axis: '',
      y2Axis: '',
    },
    defaultVisibleBarGroups: 50,
    dimensionFormatter: (dimensionID: DimensionID) => dimensionID,
    dimensionValueFormatter: (dimensionID: DimensionID, value: string | null) =>
      value === null ? 'null' : value,
    dynamicBarHeight: false,
    stack: false,
    theme: DEFAULT_THEME,
  };

  state: State = {
    dragging: false,
    focusPosition: {
      end: 0,
      start: 0,
    },
    goalLines: {
      y1Axis: Zen.Array.create(),
      y2Axis: Zen.Array.create(),
    },
    hoverData: undefined,
    hoverLine: undefined,
    innerChartSize: {
      height: 10,
      width: 10,
    },
    selectedDimensionValues: Zen.Map.create(),
  };

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
      domain: metricOrder.map(({ id }) => id),
      padding,
      rangeRound: [0, groupWidth],
    });
  }

  @memoizeOne
  buildFocusInnerGroupScale(
    metricOrder: $ReadOnlyArray<Metric>,
    padding: number,
    groupWidth: number,
  ): BandScale {
    return scaleBand({
      domain: metricOrder.map(({ id }) => id),
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
   * Build the full width that bars can be rendered to. This can be larger than
   * the visualization width since we want to enforce a minimum bar width and
   * not all bars can fit inside the panel with this constraint. The user will
   * then be able to pan to adjust which bars are in view.
   */
  getFullXAxisWidth() {
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

  enableFocusWindow() {
    const barGroupCount = this.getSortedDataPoints().length;
    return barGroupCount > this.props.defaultVisibleBarGroups;
  }

  /**
   * This is the visible width that can be seen by the user at any time.
   */
  getVisibleXAxisWidth() {
    return this.state.innerChartSize.width;
  }

  getYAxisHeight() {
    return this.state.innerChartSize.height;
  }

  @memoizeOne
  buildChartYScales(
    dataPoints: $ReadOnlyArray<DataPoint>,
    metricOrder: $ReadOnlyArray<Metric>,
    height: number,
    stack: boolean,
  ): [LinearScale | void, LinearScale | void] {
    return buildYScales(dataPoints, metricOrder, height, stack);
  }

  @memoizeOne
  buildFocusChartYScales(
    dataPoints: $ReadOnlyArray<DataPoint>,
    metricOrder: $ReadOnlyArray<Metric>,
    height: number,
    stack: boolean,
  ): [LinearScale | void, LinearScale | void] {
    return buildYScales(dataPoints, metricOrder, height, stack);
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
    const { dynamicBarHeight, stack, metricOrder } = this.props;
    const dataPoints =
      dynamicBarHeight && this.enableFocusWindow()
        ? this.getVisibleDataPoints()
        : this.getSortedDataPoints();
    return this.buildScaleMap(
      this.getInnerGroupScale(),
      this.getBarGroupScale(),
      ...this.buildChartYScales(
        dataPoints,
        metricOrder,
        this.getYAxisHeight(),
        stack,
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
    const { metricOrder, stack, theme } = this.props;
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
        theme.focus.height,
        stack,
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
    // eslint-disable-next-line no-unused-vars
    selectedDimensionValues: Zen.Map<Set<string | null>>,
    // eslint-disable-next-line no-unused-vars
    axisTheme: mixed,
  ): $ReadOnlyArray<LayerData> {
    const numDataPoints = sortedDataPoints.length;
    if (numDataPoints === 0) {
      return [];
    }

    const currentDimensions = [];
    return levels.map(({ dimensionID }: LevelSpec) => {
      currentDimensions.push(dimensionID);
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
        layerDimensions: currentDimensions.slice(),
        layerValues,
      };
    });
  }

  getAxisLayers(): $ReadOnlyArray<LayerData> {
    const { levels, theme } = this.props;

    // HACK(stephen): Passing in `selectedDimensionValues` and `xAxis` theme
    // even though it is unused because we need a way to trigger a component
    // change in a deeply nested PureComponent (CollisionAvoidantAxis). Tick
    // label props are generated through a callback which is autobinded. This
    // means that the prop doesn't change even though the *result* of calling
    // the function is different. The simplest way to trigger the update (from
    // what I've found) is to rebuild the axis layers object.
    return this.buildAxisLayers(
      levels,
      this.getSortedDataPoints(),
      this.getDataPointKeyMap(),
      this.state.selectedDimensionValues,
      theme.axis.xAxis.ticks.label,
    );
  }

  isSelected(dimensionValues: { +[DimensionID]: string | null }): boolean {
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
    const { selectedDimensionValues } = this.state;

    // If no one is selected, full color.
    return selectedDimensionValues.isEmpty() ||
      this.isSelected(dataPoint.dimensions)
      ? 1
      : 0.25;
  }

  @autobind
  tickLabelProps(layerValue: LayerValue) {
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

  @autobind
  axisValueFormatter(
    layerValue: LayerValue,
    layerDimensions: $ReadOnlyArray<DimensionID>,
  ): string {
    const dimensionID = layerDimensions[layerDimensions.length - 1];
    const rawValue = layerValue[dimensionID];
    if (rawValue === undefined) {
      return '';
    }

    return this.props.dimensionValueFormatter(dimensionID, rawValue);
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
    event: SyntheticMouseEvent<window.SVGRectElement>,
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
  onY1AxisHoverMove(metric: Metric, value: number) {
    this.onYAxisHoverMove('y1Axis', metric, value);
  }

  @autobind
  onY2AxisHoverMove(metric: Metric, value: number) {
    this.onYAxisHoverMove('y2Axis', metric, value);
  }

  @autobind
  onYAxisHoverMove(axis: YAxisID, metric: Metric, value: number) {
    const hoverLine = {
      axis,
      metric,
      value,
      id: 'hover',
    };
    this.setState({ hoverLine });
  }

  @autobind
  onYAxisHoverEnd() {
    this.setState({ hoverLine: undefined });
  }

  @autobind
  onGoalLineClick(goalLineID: string) {
    this.setState(prevState => {
      const { goalLines, hoverLine } = prevState;
      if (hoverLine === undefined) {
        return prevState;
      }

      const { axis } = hoverLine;
      const axisGoalLines = goalLines[axis];
      const idx = axisGoalLines.findIndex(
        ({ id }: GoalLineData) => id === goalLineID,
      );

      const newGoalLines = { ...goalLines };
      if (idx !== -1) {
        newGoalLines[axis] = axisGoalLines.delete(idx);
        return { goalLines: newGoalLines };
      }

      const goalLineData = {
        ...hoverLine,
        id: `goal-line-${axisGoalLines.size()}`,
      };
      newGoalLines[axis] = axisGoalLines.push(goalLineData);
      return {
        goalLines: newGoalLines,
      };
    });
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

  maybeRenderTooltip() {
    const { hoverData } = this.state;
    if (!hoverData) {
      return null;
    }

    const { dimensionFormatter, dimensionValueFormatter } = this.props;
    const { dataPoint, metric, point } = hoverData;
    return (
      <BarGraphTooltip
        backgroundColor={metric.color}
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
  ): React.Element<typeof MetricAxis> | null {
    const { axisTitles, metricOrder, theme } = this.props;
    const { goalLines, hoverLine } = this.state;
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
    return (
      <MetricAxis
        axisOrientation="left"
        chartWidth={this.getVisibleXAxisWidth()}
        goalLineThemes={theme.goalLine}
        goalLines={goalLines.y1Axis.arrayView()}
        height={this.getYAxisHeight()}
        hoverLine={axisHoverLine}
        innerRef={innerRef}
        metric={metric}
        onGoalLineClick={this.onGoalLineClick}
        onHoverMove={this.onY1AxisHoverMove}
        onHoverEnd={this.onYAxisHoverEnd}
        stroke={theme.stroke}
        tickColor={axisTheme.ticks.color}
        tickLabelProps={axisTheme.ticks.label}
        title={axisTitles.y1Axis}
        titleLabelProps={axisTheme.title}
        yScale={y1Scale}
      />
    );
  }

  @autobind
  maybeRenderY2Axis(innerRef: (React.ElementRef<'g'> | null) => void) {
    const { axisTitles, metricOrder, theme } = this.props;
    const { goalLines, hoverLine } = this.state;
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
    return (
      <MetricAxis
        axisOrientation="right"
        chartWidth={this.getVisibleXAxisWidth()}
        goalLineThemes={theme.goalLine}
        goalLines={goalLines.y2Axis.arrayView()}
        height={this.getYAxisHeight()}
        hoverLine={axisHoverLine}
        innerRef={innerRef}
        metric={metric}
        onGoalLineClick={this.onGoalLineClick}
        onHoverMove={this.onY2AxisHoverMove}
        onHoverEnd={this.onYAxisHoverEnd}
        stroke={theme.stroke}
        tickColor={axisTheme.ticks.color}
        tickLabelProps={axisTheme.ticks.label}
        title={axisTitles.y2Axis}
        titleLabelProps={axisTheme.title}
        yScale={y2Scale}
      />
    );
  }

  maybeRenderFocus() {
    if (!this.enableFocusWindow()) {
      return null;
    }

    const { metricOrder, stack, theme } = this.props;
    const { height, marginTop } = theme.focus;
    const width = this.getVisibleXAxisWidth();

    // HACK(stephen): Need a better way to place focus bar beneath the x-axis
    // than this approximation nonsense.
    const layerCount = this.getAxisLayers().length;

    // Assume maximum 3 levels per layer. Include extra offset for the non-first
    // layer.
    const maxLevels = 3;
    const offsetTop =
      // Text level height.
      19.3 * maxLevels * layerCount +
      // Tick height per layer.
      8 * layerCount +
      // Include extra offset for the non-first layers.
      (layerCount > 1 ? (layerCount - 1) * 8 : 0) +
      // Focus window margin.
      marginTop;
    const { start, end } = this.state.focusPosition;
    return (
      <g transform={`translate(0, ${offsetTop})`}>
        <FocusWindow
          focusEnd={end}
          focusStart={start}
          height={height}
          onDragStart={this.onFocusDragStart}
          onDragStop={this.onFocusDragStop}
          onFocusAreaChange={this.onFocusAreaChange}
          width={width}
        >
          <BarSeries
            barGroupOpacity={this.getBarGroupOpacity}
            dataPointKeyMap={this.getDataPointKeyMap()}
            dataPoints={this.getSortedDataPoints()}
            height={height}
            metricOrder={metricOrder}
            scales={this.getFocusScales()}
            stack={stack}
            width={width}
          />
        </FocusWindow>
      </g>
    );
  }

  maybeRenderXAxis() {
    const { axisTitles, theme, width } = this.props;
    const axisHeight = this.getYAxisHeight();
    if (axisHeight <= 0 || width === 0) {
      return null;
    }

    const barGroupScale = this.getBarGroupScale();
    const padding = barGroupScale.step() - barGroupScale.bandwidth();
    const axisTheme = theme.axis.xAxis;
    return (
      <React.Fragment>
        <LayeredAxis
          axisValueFormatter={this.axisValueFormatter}
          groupPadding={padding}
          layers={this.getAxisLayers()}
          onAxisValueClick={this.onAxisValueClick}
          scale={this.getBarGroupScale()}
          stroke={theme.stroke}
          tickColor={axisTheme.ticks.color}
          tickLabelProps={this.tickLabelProps}
          title={axisTitles.xAxis}
          titleLabelProps={axisTheme.title}
          width={this.getVisibleXAxisWidth()}
        />
        {this.maybeRenderFocus()}
      </React.Fragment>
    );
  }

  renderInnerChart() {
    const { metricOrder, stack } = this.props;
    const { innerChartSize, selectedDimensionValues } = this.state;
    const { height, width } = innerChartSize;

    // HACK(stephen): Passing `selectedDimensionValues` into the `BarSeries`
    // component so that we trigger a rerender when it changes. This is because
    // the `BarSeries` component does not know when the bar group opacity
    // has changed since it is an autobound callback.
    return (
      <React.Fragment>
        <RectClipPath id={INNER_CHART_CLIP} height={height} width={width} />
        <g clipPath={`url(#${INNER_CHART_CLIP})`}>
          <BarSeries
            barGroupOpacity={this.getBarGroupOpacity}
            dataPointKeyMap={this.getDataPointKeyMap()}
            dataPoints={this.getSortedDataPoints()}
            height={height}
            hideOverflowing
            metricOrder={metricOrder}
            onHoverEnd={this.onHoverEnd}
            onHoverStart={this.onHoverStart}
            selectedDimensionValues={selectedDimensionValues}
            scales={this.getScales()}
            stack={stack}
            width={this.getVisibleXAxisWidth()}
          />
        </g>
      </React.Fragment>
    );
  }

  @autobind
  renderGraph() {
    const { height, width } = this.props;
    return (
      <ResponsiveContainer
        axisBottom={this.maybeRenderXAxis()}
        axisLeft={this.maybeRenderY1Axis}
        axisRight={this.maybeRenderY2Axis}
        chart={this.renderInnerChart()}
        disableResize={this.state.dragging}
        height={height}
        onChartResize={this.onInnerChartResize}
        width={width}
      />
    );
  }

  render() {
    return (
      <div style={{ position: 'relative' }}>
        {this.renderGraph()}
        {this.maybeRenderTooltip()}
      </div>
    );
  }
}
