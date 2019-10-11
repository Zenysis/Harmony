// @flow
import * as React from 'react';
import { ParentSize } from '@vx/responsive';

import * as Zen from 'lib/Zen';
import BarGraphCore, {
  DEFAULT_THEME,
} from 'components/ui/visualizations/BarGraph';
import BarGraphQueryResultData from 'components/visualizations/BarGraphTNG/models/BarGraphQueryResultData';
import Legend from 'components/visualizations/common/Legend';
import Visualization from 'components/visualizations/common/Visualization';
import {
  SORT_ASCENDING,
  SORT_DESCENDING,
} from 'components/QueryResult/graphUtil';
import { TIMESTAMP_GROUPING_ID } from 'models/core/QueryResultSpec/QueryResultGrouping';
import { autobind, memoizeOne } from 'decorators';
// TODO(stephen): Extract this utility out of Table!
import { mixedValueSort } from 'components/ui/visualizations/Table/util';
import { visualizationDefaultProps } from 'components/visualizations/common/commonTypes';
import type AxesSettings from 'models/core/QueryResultSpec/VisualizationSettings/AxesSettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { ChartSize } from 'components/ui/visualizations/types';
import type {
  DataPoint,
  DimensionID,
  Metric,
  MetricID,
} from 'components/ui/visualizations/BarGraph/types';
import type { LevelSpec } from 'components/ui/visualizations/BarGraph/internal/LayeredAxis/types';
import type { VisualizationProps } from 'components/visualizations/common/commonTypes';

type Props = VisualizationProps<'BAR_GRAPH'>;

type State = {
  disabledMetrics: Zen.Map<true>,
};

function buildAxisTheme(
  axesSettings: AxesSettings,
  axis: 'xAxis' | 'y1Axis' | 'y2Axis',
  theme: $Prop<BarGraphCore, 'theme'>,
) {
  const axisSettings = axesSettings.get(axis);
  const currentAxisTheme = theme.axis[axis];

  // NOTE(stephen): Using `axisSettings.get` because flow cannot refine the
  // union type that results from axesSettings.get('y1Axis').
  return {
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
  static defaultProps = {
    ...visualizationDefaultProps,
    queryResult: BarGraphQueryResultData.create({}),
  };

  state = {
    disabledMetrics: Zen.Map.create(),
  };

  @memoizeOne
  buildAxisTitles(axesSettings: AxesSettings) {
    return {
      xAxis: axesSettings.xAxis().title(),
      y1Axis: axesSettings.y1Axis().title(),
      y2Axis: axesSettings.y2Axis().title(),
    };
  }

  @memoizeOne
  buildTheme(axesSettings: AxesSettings): $Prop<BarGraphCore, 'theme'> {
    const axisTitleTheme = {
      xAxis: buildAxisTheme(axesSettings, 'xAxis', DEFAULT_THEME),
      y1Axis: buildAxisTheme(axesSettings, 'y1Axis', DEFAULT_THEME),
      y2Axis: buildAxisTheme(axesSettings, 'y2Axis', DEFAULT_THEME),
    };

    return {
      ...DEFAULT_THEME,
      axis: axisTitleTheme,
    };
  }

  @memoizeOne
  buildLevels(
    dimensions: $ReadOnlyArray<string>,
    seriesOrder: $ReadOnlyArray<string>,
    sortOrder: SORT_ASCENDING | SORT_DESCENDING,
    sortField: MetricID,
  ): $ReadOnlyArray<LevelSpec> {
    return dimensions.map((dimensionID: string, idx: number) => {
      const descending =
        dimensions.length > 1
          ? false
          : sortOrder === SORT_DESCENDING &&
            dimensionID !== TIMESTAMP_GROUPING_ID;

      // If this is the last dimension, sort by the first series.
      // TODO(stephen): Will need to add test when control for switching between
      // "sort by indicators" vs "sort by groups" is made into a setting.
      if (
        dimensions.length === 1 &&
        idx === dimensions.length - 1 &&
        dimensionID !== TIMESTAMP_GROUPING_ID
      ) {
        return {
          dimensionID,
          comparator: (a: DataPoint, b: DataPoint) =>
            mixedValueSort(
              a.metrics[sortField],
              b.metrics[sortField],
              descending,
            ),
        };
      }

      // Otherwise, sort by the dimension value alphabetically.
      return {
        dimensionID,
        comparator: (a: DataPoint, b: DataPoint) =>
          mixedValueSort(
            a.dimensions[dimensionID],
            b.dimensions[dimensionID],
            descending,
          ),
      };
    });
  }

  @memoizeOne
  buildMetricOrder(
    seriesSettings: SeriesSettings,
    disabledMetrics: Zen.Map<true>,
  ): $ReadOnlyArray<Metric> {
    const seriesObjects = seriesSettings.seriesObjects();
    const output = [];
    seriesSettings.seriesOrder().forEach(metricID => {
      const seriesObject = seriesObjects[metricID];
      if (
        seriesObject === undefined ||
        !seriesObject.isVisible() ||
        disabledMetrics.get(metricID, false)
      ) {
        return;
      }

      output.push({
        axis: seriesObject.yAxis() === 'y2Axis' ? 'y2Axis' : 'y1Axis',
        color: seriesObject.color(),
        displayName: seriesObject.label(),
        formatValue: value => seriesObject.formatFieldValue(value),
        id: metricID,
      });
    });
    return output;
  }

  getMetricOrder(): $ReadOnlyArray<Metric> {
    return this.buildMetricOrder(
      this.props.seriesSettings,
      this.state.disabledMetrics,
    );
  }

  @autobind
  formatDimensionValue(dimensionID: DimensionID, value: string | null): string {
    if (value === null) {
      return 'null';
    }

    const grouping = this.props.groupBySettings.groupings().get(dimensionID);
    if (grouping === undefined) {
      return value;
    }

    return grouping.formatGroupingValue(value, true);
  }

  getLevels(): $ReadOnlyArray<LevelSpec> {
    const { controls, queryResult, seriesSettings } = this.props;
    return this.buildLevels(
      queryResult.dimensions(),
      seriesSettings.seriesOrder(),
      controls.sortOrder,
      controls.sortOn,
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
  maybeRenderBarGraph({ width, height }: ChartSize) {
    const { axesSettings, controls, loading, queryResult } = this.props;
    const metricOrder = this.getMetricOrder();
    if (loading || queryResult.isEmpty() || metricOrder.length === 0) {
      return null;
    }

    return (
      <BarGraphCore
        axisTitles={this.buildAxisTitles(axesSettings)}
        dataPoints={queryResult.data()}
        defaultVisibleBarGroups={controls.resultLimit}
        dimensionOrder={queryResult.dimensions()}
        dimensionFormatter={this.formatDimension}
        dimensionValueFormatter={this.formatDimensionValue}
        levels={this.getLevels()}
        metricOrder={this.getMetricOrder()}
        height={height}
        stack={controls.stackBars}
        theme={this.buildTheme(axesSettings)}
        width={width}
      />
    );
  }

  // HACK(stephen): This is a temporary hack to throw a legend in. Stolen from
  // original bar graph.
  maybeRenderLegend() {
    const { seriesSettings } = this.props;
    const { seriesOrder, seriesObjects } = seriesSettings.modelValues();

    // get the series that are still set as visible in the settings modal
    const visibleSeries = seriesOrder
      .filter(id => seriesObjects[id].isVisible())
      .map(id => seriesObjects[id]);

    return (
      <div
        className="legend-container"
        style={{ marginTop: 0, padding: 10, textAlign: 'left' }}
      >
        <Legend
          disabledSeriesIds={this.state.disabledMetrics.objectView()}
          fontSize="14px"
          onToggleSeries={this.onLegendClick}
          seriesObjects={visibleSeries}
        />
      </div>
    );
  }

  render() {
    return (
      <Visualization
        footer={this.maybeRenderLegend()}
        loading={this.props.loading}
      >
        <ParentSize>{this.maybeRenderBarGraph}</ParentSize>
      </Visualization>
    );
  }
}
