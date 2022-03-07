// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import BarGraphCore from 'components/ui/visualizations/BarGraph';
import BarGraphQueryResultData from 'models/visualizations/BarGraph/BarGraphQueryResultData';
import Legend from 'components/visualizations/common/Legend';
import Visualization from 'components/visualizations/common/Visualization';
import buildAlphabeticalDimensionSortComparator from 'components/visualizations/BarGraph/buildAlphabeticalDimensionSortComparator';
import { DEFAULT_THEME } from 'components/ui/visualizations/BarGraph/defaults';
import { SORT_DESCENDING } from 'components/QueryResult/graphUtil';
import { TIMESTAMP_GROUPING_ID } from 'models/core/QueryResultSpec/QueryResultGrouping';
import { autobind, memoizeOne } from 'decorators';
// TODO(stephen): Extract this utility out of Table!
import { mixedValueSort } from 'components/ui/visualizations/Table/sorting';
import { visualizationDefaultProps } from 'components/visualizations/common/commonTypes';
import type AxesSettings from 'models/core/QueryResultSpec/VisualizationSettings/AxesSettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type {
  AxisRanges,
  BarGraphTheme,
  DataPoint,
  DimensionID,
  Metric,
  MetricID,
} from 'components/ui/visualizations/BarGraph/types';
import type { GoalLineData } from 'components/ui/visualizations/common/MetricAxis/types';
import type { LevelSpec } from 'components/ui/visualizations/BarGraph/internal/LayeredAxis/types';
import type { SortOrder } from 'components/QueryResult/graphUtil';
import type {
  VisualizationDefaultProps,
  VisualizationProps,
} from 'components/visualizations/common/commonTypes';

type DefaultProps = {
  ...VisualizationDefaultProps<'BAR_GRAPH'>,
  queryResult: BarGraphQueryResultData,
};

type Props = VisualizationProps<'BAR_GRAPH'>;

type State = {
  disabledMetrics: Zen.Map<true>,
};

const MAX_ROTATED_TEXT_LENGTH = 15;
const LEGEND_CONTAINER_STYLE = {
  marginTop: 4,
  padding: 10,
  position: 'relative',
  textAlign: 'left',
};

function buildAxisTheme(
  axesSettings: AxesSettings,
  axis: 'xAxis' | 'y1Axis' | 'y2Axis',
  theme: BarGraphTheme,
) {
  const axisSettings = axesSettings.get(axis);
  const currentAxisTheme = theme.axis[axis];

  // NOTE(stephen): Using `axisSettings.get` because flow cannot refine the
  // union type that results from axesSettings.get('y1Axis').
  return {
    stroke: currentAxisTheme.stroke,
    ticks: {
      color: currentAxisTheme.ticks.color,
      label: {
        ...currentAxisTheme.ticks.label,
        fill: axisSettings.get('labelsFontColor'),
        fontFamily: axisSettings.get('labelsFontFamily'),
        fontSize: axisSettings.get('labelsFontSize'),
      },
    },
    title: {
      ...currentAxisTheme.title,
      fill: axisSettings.get('titleFontColor'),
      fontFamily: axisSettings.get('titleFontFamily'),
      fontSize: axisSettings.get('titleFontSize'),
      textAnchor: 'middle',
    },
  };
}

export default class BarGraph extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    ...visualizationDefaultProps,
    queryResult: BarGraphQueryResultData.create({}),
  };

  state: State = {
    disabledMetrics: Zen.Map.create(),
  };

  @memoizeOne
  buildAxisTitles(
    axesSettings: AxesSettings,
  ): {
    xAxis: string,
    y1Axis: string,
    y2Axis: string,
  } {
    return {
      xAxis: axesSettings.xAxis().title(),
      y1Axis: axesSettings.y1Axis().title(),
      y2Axis: axesSettings.y2Axis().title(),
    };
  }

  @memoizeOne
  buildTheme(
    axesSettings: AxesSettings,
    rotateInnerGroupLabels: boolean,
    applyMinimumBarHeight: boolean,
    barDirection: 'horizontal' | 'vertical',
  ): BarGraphTheme {
    const axisTitleTheme = {
      xAxis: {
        ...buildAxisTheme(axesSettings, 'xAxis', DEFAULT_THEME),
        maxInnerLayerTextLength: rotateInnerGroupLabels
          ? MAX_ROTATED_TEXT_LENGTH
          : undefined,
      },
      y1Axis: buildAxisTheme(axesSettings, 'y1Axis', DEFAULT_THEME),
      y2Axis: buildAxisTheme(axesSettings, 'y2Axis', DEFAULT_THEME),
    };

    // HACK(stephen): Need a better way to rotate the x-axis title text in
    // horizontal bar mode.
    // TODO(stephen): This should be done by the core BarGraph and not by the
    // user!
    if (barDirection === 'horizontal') {
      axisTitleTheme.xAxis.title.transform = 'rotate(180)';
    }
    return {
      ...DEFAULT_THEME,
      axis: axisTitleTheme,
      minBarHeight: applyMinimumBarHeight ? 2 : 0,
    };
  }

  @memoizeOne
  buildLevels(
    dimensions: $ReadOnlyArray<string>,
    seriesOrder: $ReadOnlyArray<string>,
    sortOrder: SortOrder,
    sortBy: string,
    rotateInnerGroupLabels: boolean,
    dataPoints: $ReadOnlyArray<DataPoint>,
  ): $ReadOnlyArray<LevelSpec> {
    return dimensions.map((dimensionID: string, idx: number) => {
      const descending =
        dimensions.length > 1
          ? false
          : sortOrder === SORT_DESCENDING &&
            dimensionID !== TIMESTAMP_GROUPING_ID;

      const angle =
        idx > 0 && rotateInnerGroupLabels ? 'vertical' : 'horizontal';

      // If there is only one dimension, and the `sortBy` is a field, then we
      // should use a `mixedValueSort` on the field values
      if (
        dimensions.length === 1 &&
        idx === dimensions.length - 1 &&
        dimensionID !== TIMESTAMP_GROUPING_ID &&
        seriesOrder.includes(sortBy)
      ) {
        return {
          angle,
          dimensionID,
          comparator: (a: DataPoint, b: DataPoint) =>
            mixedValueSort(a.metrics[sortBy], b.metrics[sortBy], descending),
        };
      }

      const dimensionValues = dataPoints.map(d => d.dimensions[dimensionID]);

      // Fallback: sort by the dimension value alphabetically.
      return {
        angle,
        dimensionID,
        comparator: buildAlphabeticalDimensionSortComparator(
          dimensionValues,
          dimensionID,
          descending,
        ),
      };
    });
  }

  @memoizeOne
  buildMetricOrder(
    seriesSettings: SeriesSettings,
    disabledMetrics: Zen.Map<true>,
    barDirection: 'horizontal' | 'vertical',
    valueTextAngle: 'auto' | 'vertical',
  ): $ReadOnlyArray<Metric> {
    const seriesObjects = seriesSettings.seriesObjects();
    const output = [];

    // If the bar direction is horizontal, then we always want the value text
    // to be displayed inline with the bar at the same level. If the bar chart
    // is vertical, we allow the BarGraph component to determine how to best
    // lay out the text.
    // TODO(stephen): This is a leaky abstraction that we need to fix. To set
    // the correct angle so that text is rendered horizontally, we have to
    // rotate it 90 degrees. That's weird! The users of the BarGraph core
    // component should not need to know that rotations are different when the
    // chart is in horizontal mode. A value of 0 would make sense.
    // TODO(sophie): For now, the only user customization allowed is vertical
    // text with a vertical bar direction (which happens to be the same angle
    // as for the horizontal layout, this is not on purpose). As we expand the
    // options for this setting, we'll need a more robust way of getting the
    // numerical angle from the options allowed in the controls.
    let derivedAngle = 'auto';
    if (barDirection === 'horizontal' || valueTextAngle === 'vertical') {
      derivedAngle = 90;
    }

    seriesSettings.seriesOrder().forEach(metricID => {
      const seriesObject = seriesObjects[metricID];
      if (
        seriesObject === undefined ||
        !seriesObject.isVisible() ||
        disabledMetrics.get(metricID, false)
      ) {
        return;
      }

      const formatValue = (value: number | null) =>
        seriesObject.formatFieldValue(value);
      const y2AxisSelected = seriesObject.yAxis() === 'y2Axis';
      output.push({
        axis: y2AxisSelected ? 'y2Axis' : 'y1Axis',
        barLabelPosition: seriesObject.barLabelPosition(),
        color: seriesObject.color(),
        displayName: seriesObject.label(),
        visualDisplayShape: seriesObject.visualDisplayShape(),
        id: metricID,
        showValue: seriesObject.showSeriesValue(),
        valueFontSize: seriesObject.dataLabelFontSize(),
        formatValue,
        valueTextAngle: derivedAngle,
      });
    });
    return output;
  }

  getMetricOrder(): $ReadOnlyArray<Metric> {
    const { controls, seriesSettings } = this.props;
    return this.buildMetricOrder(
      seriesSettings,
      this.state.disabledMetrics,
      controls.barDirection(),
      controls.valueTextAngle(),
    );
  }

  // NOTE(stephen): Small perf boost to cache this. When the user is dragging
  // the focus window, making this comparison for each value on the axis can
  // be time consuming and cause jitter.
  @memoizeOne
  buildDimensionToTruncate(
    queryResult: BarGraphQueryResultData,
  ): string | void {
    const dimensions = queryResult.dimensions();
    const dimensionCount = dimensions.length;

    // Only truncate the innermost grouping when there is more than one grouping
    // being shown.
    return dimensionCount <= 1 ? undefined : dimensions[dimensionCount - 1];
  }

  @autobind
  formatDimensionValue(dimensionID: DimensionID, value: string | null): string {
    const grouping = this.props.groupBySettings.groupings().get(dimensionID);
    if (grouping === undefined) {
      return value || 'null';
    }

    return grouping.formatGroupingValue(value, true);
  }

  getLevels(): $ReadOnlyArray<LevelSpec> {
    const { controls, queryResult, seriesSettings } = this.props;
    return this.buildLevels(
      queryResult.dimensions(),
      seriesSettings.seriesOrder(),
      controls.sortOrder(),
      controls.sortOn(),
      controls.rotateInnerGroupLabels(),
      queryResult.data(),
    );
  }

  @autobind
  formatDimension(dimensionID: string): string {
    const { groupBySettings } = this.props;
    const settings = groupBySettings.settingsForGroup(dimensionID);
    if (settings === undefined) {
      return dimensionID;
    }

    return settings.displayLabel();
  }

  getYAxisRanges(axesSettings: AxesSettings): AxisRanges {
    return {
      y1Axis: {
        min: axesSettings.y1Axis().rangeFrom(),
        max: axesSettings.y1Axis().rangeTo(),
      },
      y2Axis: {
        min: axesSettings.y2Axis().rangeFrom(),
        max: axesSettings.y2Axis().rangeTo(),
      },
    };
  }

  @autobind
  onGoalLineChange(goalLines: $ReadOnlyArray<GoalLineData>) {
    this.props.onControlsSettingsChange(
      'goalLines',
      Zen.Array.create(goalLines),
    );
  }

  @autobind
  onLegendClick(metricID: MetricID) {
    this.setState(({ disabledMetrics }) => {
      if (disabledMetrics.has(metricID)) {
        return {
          disabledMetrics: disabledMetrics.delete(metricID),
        };
      }

      return {
        disabledMetrics: disabledMetrics.set(metricID, true),
      };
    });
  }

  @autobind
  maybeRenderBarGraph(height: number, width: number): React.Node {
    const {
      axesSettings,
      controls,
      loading,
      queryResult,
      smallMode,
    } = this.props;
    const metricOrder = this.getMetricOrder();
    if (loading || queryResult.isEmpty() || metricOrder.length === 0) {
      return null;
    }

    const enableFocusWindow = controls.alwaysShowFocusWindow() || !smallMode;
    const barDirection = controls.barDirection();
    const theme = this.buildTheme(
      axesSettings,
      controls.rotateInnerGroupLabels(),
      controls.applyMinimumBarHeight(),
      barDirection,
    );
    return (
      <BarGraphCore
        axisRanges={this.getYAxisRanges(axesSettings)}
        axisTitles={this.buildAxisTitles(axesSettings)}
        barDirection={barDirection}
        barTreatment={controls.barTreatment()}
        dataPoints={queryResult.data()}
        defaultVisibleBarGroups={controls.resultLimit()}
        dimensionOrder={queryResult.dimensions()}
        dimensionFormatter={this.formatDimension}
        dimensionValueFormatter={this.formatDimensionValue}
        dynamicBarHeight={!enableFocusWindow}
        enableFocusWindow={enableFocusWindow}
        goalLines={controls.goalLines().arrayView()}
        height={height}
        levels={this.getLevels()}
        metricOrder={metricOrder}
        onGoalLineChange={this.onGoalLineChange}
        theme={theme}
        width={width}
      />
    );
  }

  // HACK(stephen): This is a temporary hack to throw a legend in. Stolen from
  // original bar graph.
  maybeRenderLegend(): React.Node {
    const { seriesSettings } = this.props;
    const { seriesOrder, seriesObjects } = seriesSettings.modelValues();

    // get the series that are still set as visible in the settings modal
    const visibleSeries = seriesOrder
      .filter(id => seriesObjects[id].isVisible())
      .map(id => seriesObjects[id]);

    return (
      <div className="legend-container" style={LEGEND_CONTAINER_STYLE}>
        <Legend
          disabledSeriesIds={this.state.disabledMetrics.objectView()}
          fontSize="13px"
          onToggleSeries={this.onLegendClick}
          seriesObjects={visibleSeries}
        />
      </div>
    );
  }

  render(): React.Node {
    return (
      <Visualization
        className="bar-graph-visualization"
        footer={this.maybeRenderLegend()}
        loading={this.props.loading}
      >
        {this.maybeRenderBarGraph}
      </Visualization>
    );
  }
}
