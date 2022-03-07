// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import BarGraphCore from 'components/ui/visualizations/BarGraph';
import HistogramQueryResultData from 'models/visualizations/Histogram/HistogramQueryResultData';
import SeriesRow from 'components/visualizations/common/Legend/SeriesRow';
import Visualization from 'components/visualizations/common/Visualization';
import buildAlphabeticalDimensionSortComparator from 'components/visualizations/BarGraph/buildAlphabeticalDimensionSortComparator';
import { DEFAULT_THEME } from 'components/ui/visualizations/BarGraph/defaults';
import { DEFAULT_TIME_FORMAT } from 'components/visualizations/Histogram/HistogramControlsBlock';
import { TIMESTAMP_GROUPING_ID } from 'models/core/QueryResultSpec/QueryResultGrouping';
import { autobind, memoizeOne } from 'decorators';
import { formatDate } from 'util/dateUtil';
import { visualizationDefaultProps } from 'components/visualizations/common/commonTypes';
import type AxesSettings from 'models/core/QueryResultSpec/VisualizationSettings/AxesSettings';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type QueryResultGrouping from 'models/core/QueryResultSpec/QueryResultGrouping';
import type QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
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
import type {
  VisualizationDefaultProps,
  VisualizationProps,
} from 'components/visualizations/common/commonTypes';

type DefaultProps = {
  ...VisualizationDefaultProps<'EPICURVE'>,
  queryResult: HistogramQueryResultData,
};

type Props = VisualizationProps<'EPICURVE'>;

type State = {
  disabledMetrics: Zen.Map<true>,
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

const DIMENSION_ORDER = [TIMESTAMP_GROUPING_ID];

function sortDimensionValues(
  dimensionValues: $ReadOnlyArray<string | null>,
): $ReadOnlyArray<string | null> {
  // Use the bar graph's comparator builder so we can handle age range sorting
  // cleanly.
  const comparator = buildAlphabeticalDimensionSortComparator(
    dimensionValues,
    'example',
    false,
  );

  // Build some dummy data points so that the comparator can be used without
  // modification.
  return dimensionValues
    .map(d => ({
      dimensions: { example: d },
      metrics: {},
    }))
    .sort(comparator)
    .map(({ dimensions }) => dimensions.example);
}

// When the user is displaying stacked bars based on grouping value, the
// underlying `metrics` object of each DataPoint will contain dimension values
// as keys and the selected field ID's value for the value. Produce an array of
// Metrics that will allow the core BarGraph to work without needing to know
// this pivot has happened.
function buildStackedGroupingMetricOrder(
  dimensionValues: $ReadOnlyArray<string>,
  seriesObject: QueryResultSeries,
  rotateDataValueLabels: boolean,
  hideZeroValueLabels: boolean,
  palette: $ReadOnlyArray<string>,
) {
  const baseMetric = {
    axis: seriesObject.yAxis() === 'y2Axis' ? 'y2Axis' : 'y1Axis',
    barLabelPosition: seriesObject.barLabelPosition(),
    color: seriesObject.color(),
    formatValue: value =>
      !value && hideZeroValueLabels ? '' : seriesObject.formatFieldValue(value),
    showValue: seriesObject.showSeriesValue(),
    valueFontSize: seriesObject.dataLabelFontSize(),
    valueTextAngle: rotateDataValueLabels ? 'auto' : 0,
    visualDisplayShape: seriesObject.visualDisplayShape(),
  };

  return dimensionValues.map((dimensionValue, idx) => ({
    ...baseMetric,
    color: palette[idx % palette.length],
    displayName: dimensionValue,
    id: dimensionValue,
  }));
}

export default class Histogram extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    ...visualizationDefaultProps,
    queryResult: HistogramQueryResultData.create({}),
  };

  state: State = {
    disabledMetrics: Zen.Map.create(),
  };

  // TODO(stephen, anyone): Add support for y2Axis. It should just work by
  // default since we are using the BarGraph core viz.
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
    displayBorders: boolean,
  ): BarGraphTheme {
    const axisTitleTheme = {
      xAxis: {
        ...buildAxisTheme(axesSettings, 'xAxis', DEFAULT_THEME),
        maxInnerLayerTextLength: undefined,
      },
      y1Axis: buildAxisTheme(axesSettings, 'y1Axis', DEFAULT_THEME),
      y2Axis: buildAxisTheme(axesSettings, 'y2Axis', DEFAULT_THEME),
    };

    return {
      ...DEFAULT_THEME,
      axis: axisTitleTheme,
      groupPadding: 0,
      minBarHeight: 0,
      stroke: displayBorders ? 'black' : '#ffffff00',
      strokeWidth: displayBorders ? 1 : 0,
    };
  }

  @memoizeOne
  findNonDateGrouping(
    groupBySettings: GroupBySettings,
  ): QueryResultGrouping | void {
    // Find if there is a secondary dimension being grouped on other than date.
    const nonDateGroupings = [];
    groupBySettings.groupings().forEach(grouping => {
      const id = grouping.id();
      if (id !== TIMESTAMP_GROUPING_ID && id !== 'nation') {
        nonDateGroupings.push(grouping);
      }
    });

    return nonDateGroupings.length === 1 ? nonDateGroupings[0] : undefined;
  }

  // Pivot the unique dimension values to become metrics where each dimension
  // value points to the field value for the selected field.
  @memoizeOne
  buildDataPointsAndMetricsByGrouping(
    queryResult: HistogramQueryResultData,
    grouping: QueryResultGrouping,
    seriesObject: QueryResultSeries | void,
    rotateDataValueLabels: boolean,
    hideZeroValueLabels: boolean,
    palette: $ReadOnlyArray<string>,
  ): [$ReadOnlyArray<DataPoint>, $ReadOnlyArray<Metric>] {
    const dimensionId = grouping.id();
    if (
      queryResult.isEmpty() ||
      !queryResult.dimensions().includes(dimensionId) ||
      seriesObject === undefined
    ) {
      return [[], []];
    }

    const selectedFieldId = seriesObject.id();
    const nullDimensionValueReplacement = grouping.formatGroupingValue(null);
    const [
      dataPoints,
      uniqueDimensionValues,
    ] = queryResult.breakdownDimensionForField(
      dimensionId,
      selectedFieldId,
      nullDimensionValueReplacement,
    );

    // Sort the unique dimension values in the same way the BarGraph viz would
    // so that the order of metrics (aka dimension values in this case) is
    // stable and consistent. Format the dimension value for display since that
    // is what is stored on the DataPoint's metrics (i.e. `null` is replaced
    // with a string).
    const dimensionValues = sortDimensionValues(uniqueDimensionValues).map(d =>
      grouping.formatGroupingValue(d),
    );
    const metricOrder = buildStackedGroupingMetricOrder(
      dimensionValues,
      seriesObject,
      rotateDataValueLabels,
      hideZeroValueLabels,
      palette,
    );
    return [dataPoints, metricOrder];
  }

  @memoizeOne
  buildDataPointsAndMetricsByField(
    queryResult: HistogramQueryResultData,
    seriesSettings: SeriesSettings,
    rotateDataValueLabels: boolean,
    hideZeroValueLabels: boolean,
    palette: $ReadOnlyArray<string>,
    selectedField: string | void = undefined,
  ): [$ReadOnlyArray<DataPoint>, $ReadOnlyArray<Metric>] {
    if (queryResult.isEmpty()) {
      return [[], []];
    }

    const seriesObjects = seriesSettings.seriesObjects();
    const metricOrder = [];

    // Sometimes we are using the field breakdown method when the user has
    // actually chosen to breakdown by grouping. This will only happen if the
    // user is breaking down by grouping but there is no non-date grouping
    // actually selected in the form. We don't want to use the grouping
    // breakdown in this case because there is no way to format a non-existent
    // grouping value. Instead, just act like the grouping breakdown would act
    // and only show a single field.
    const showSingleField = selectedField !== undefined;
    seriesSettings.seriesOrder().forEach((metricID, idx) => {
      const seriesObject = seriesObjects[metricID];
      if (
        seriesObject === undefined ||
        !seriesObject.isVisible() ||
        (showSingleField && metricID !== selectedField)
      ) {
        return;
      }

      const y2AxisSelected = seriesObject.yAxis() === 'y2Axis';
      metricOrder.push({
        axis: y2AxisSelected ? 'y2Axis' : 'y1Axis',
        barLabelPosition: seriesObject.barLabelPosition(),
        color: palette[idx % palette.length],
        displayName: seriesObject.label(),
        formatValue: value =>
          !value && hideZeroValueLabels
            ? ''
            : seriesObject.formatFieldValue(value),
        id: metricID,
        showValue: seriesObject.showSeriesValue(),
        valueFontSize: seriesObject.dataLabelFontSize(),
        valueTextAngle: rotateDataValueLabels ? 'auto' : 0,
        visualDisplayShape: seriesObject.visualDisplayShape(),
      });
    });

    return [queryResult.fieldBreakdownData(), metricOrder];
  }

  // Build the full list of data points and metrics that each data point will
  // contain values for.
  // NOTE(stephen): The `metrics` array will contain all metrics including those
  // disabled by the legend.
  getDataPointsAndMetrics(): [
    $ReadOnlyArray<DataPoint>,
    $ReadOnlyArray<Metric>,
  ] {
    const {
      controls,
      groupBySettings,
      queryResult,
      seriesSettings,
    } = this.props;

    const rotateDataValueLabels = controls.rotateDataValueLabels();
    const hideZeroValueLabels = controls.hideZeroValueLabels();
    if (controls.breakdown() === 'field') {
      return this.buildDataPointsAndMetricsByField(
        queryResult,
        seriesSettings,
        rotateDataValueLabels,
        hideZeroValueLabels,
        controls.palette(),
      );
    }

    // If the breakdown is by grouping but there is no non-date grouping in the
    // query, fallback to breaking down by field BUT only show the single
    // selected field.
    const nonDateGrouping = this.findNonDateGrouping(groupBySettings);
    const selectedField = controls.selectedField();
    if (nonDateGrouping === undefined) {
      return this.buildDataPointsAndMetricsByField(
        queryResult,
        seriesSettings,
        rotateDataValueLabels,
        hideZeroValueLabels,
        controls.palette(),
        selectedField,
      );
    }

    const seriesObject = seriesSettings.getSeriesObject(selectedField);
    return this.buildDataPointsAndMetricsByGrouping(
      queryResult,
      nonDateGrouping,
      seriesObject,
      rotateDataValueLabels,
      hideZeroValueLabels,
      controls.palette(),
    );
  }

  @memoizeOne
  buildVisibleMetricOrder(
    fullMetricOrder: $ReadOnlyArray<Metric>,
    disabledMetrics: Zen.Map<true>,
  ): $ReadOnlyArray<Metric> {
    return fullMetricOrder.filter(({ id }) => !disabledMetrics.get(id, false));
  }

  @memoizeOne
  buildLevels(rotateXAxisLabels: boolean): $ReadOnlyArray<LevelSpec> {
    // The Histogram viz only supports a single level on timestamp. It should
    // always be sorted in ascending order.
    return [
      {
        angle: rotateXAxisLabels ? 'diagonal' : 'horizontal',
        dimensionID: TIMESTAMP_GROUPING_ID,
        comparator: (a, b) => {
          const aTimestamp = a.dimensions.timestamp || '';
          const bTimestamp = b.dimensions.timestamp || '';
          return aTimestamp.localeCompare(bTimestamp);
        },
      },
    ];
  }

  @memoizeOne
  buildDimensionValueFormatter(
    grouping: QueryResultGrouping | void,
    dateFormat: string,
  ): (dimensionId: DimensionID, value: string | null) => string {
    return (dimensionId, value) => {
      // NOTE(stephen): The Histogram viz only ever has a single x-axis level
      // that displays the timestamp. Adding this check just for safety.
      if (dimensionId !== TIMESTAMP_GROUPING_ID || grouping === undefined) {
        return value || 'null';
      }

      // Format the timestamp using the user's custom date format.
      // HACK(sophie, stephen): When using a date extraction (rather than date
      // group), the year returned in the date is 3000. Do not apply the custom
      // date format when this happens.
      // TODO(sophie, stephen): Remove once grouping settings are exposed to the
      // user. Then they can control the date format in a common way across
      // visualizations and the format will be applied transparently by a call
      // to `formatGroupingValue`.
      if (
        value !== null &&
        dateFormat !== DEFAULT_TIME_FORMAT &&
        !value.startsWith('3000')
      ) {
        return formatDate(value, dateFormat);
      }

      return grouping.formatGroupingValue(value, true);
    };
  }

  getDimensionValueFormatter(): (
    dimensionId: DimensionID,
    value: string | null,
  ) => string {
    const { controls, groupBySettings } = this.props;
    return this.buildDimensionValueFormatter(
      groupBySettings.groupings().get(TIMESTAMP_GROUPING_ID),
      controls.xTickFormat(),
    );
  }

  @autobind
  formatDimension(dimensionId: string): string {
    const { groupBySettings } = this.props;
    const settings = groupBySettings.settingsForGroup(dimensionId);
    if (settings === undefined) {
      return dimensionId;
    }

    return settings.displayLabel();
  }

  @autobind
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
    const { axesSettings, controls, loading, smallMode } = this.props;
    const [dataPoints, fullMetricOrder] = this.getDataPointsAndMetrics();
    const visibleMetricOrder = this.buildVisibleMetricOrder(
      fullMetricOrder,
      this.state.disabledMetrics,
    );
    if (loading || dataPoints.length === 0 || visibleMetricOrder.length === 0) {
      return null;
    }

    const enableFocusWindow = controls.alwaysShowFocusWindow() || !smallMode;
    const theme = this.buildTheme(axesSettings, controls.displayBorders());
    return (
      <BarGraphCore
        axisRanges={this.getYAxisRanges(axesSettings)}
        axisTitles={this.buildAxisTitles(axesSettings)}
        barTreatment={controls.barTreatment()}
        dataPoints={dataPoints}
        defaultVisibleBarGroups={controls.resultLimit()}
        dimensionOrder={DIMENSION_ORDER}
        dimensionFormatter={this.formatDimension}
        dimensionValueFormatter={this.getDimensionValueFormatter()}
        dynamicBarHeight={!enableFocusWindow}
        enableFocusWindow={enableFocusWindow}
        goalLines={controls.goalLines().arrayView()}
        height={height}
        levels={this.buildLevels(controls.rotateXAxisLabels())}
        metricOrder={visibleMetricOrder}
        onGoalLineChange={this.onGoalLineChange}
        theme={theme}
        width={width}
      />
    );
  }

  // HACK(stephen): This is a temporary hack to throw a legend in. Kind of
  // matches the BarGraph implementation but has to manually render the legend
  // rows because the common Legend component is too limiting.
  renderLegend(): React.Node {
    const { disabledMetrics } = this.state;
    const metricOrder = this.getDataPointsAndMetrics()[1];
    return (
      <div style={{ padding: !this.props.smallMode ? 10 : 0 }}>
        {metricOrder.map(({ color, displayName, id }) => (
          <SeriesRow
            fontSize="13px"
            isDisabled={disabledMetrics.get(id, false)}
            key={id}
            onSeriesClick={this.onLegendClick}
            seriesId={id}
            seriesColor={color}
            seriesLabel={displayName}
          />
        ))}
      </div>
    );
  }

  render(): React.Node {
    return (
      <Visualization
        className="histogram-visualization"
        footer={this.renderLegend()}
        loading={this.props.loading}
      >
        {this.maybeRenderBarGraph}
      </Visualization>
    );
  }
}
