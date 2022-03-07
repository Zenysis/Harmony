// @flow
import * as React from 'react';

import BoxPlotCore from 'components/ui/visualizations/BoxPlot';
import BoxPlotQueryResultData from 'models/visualizations/BoxPlot/BoxPlotQueryResultData';
import BoxPlotTheme from 'components/ui/visualizations/BoxPlot/models/BoxPlotTheme';
import BoxPlotTooltip from 'components/ui/visualizations/BoxPlot/internal/BoxPlotTooltip';
import Visualization from 'components/visualizations/common/Visualization';
import { autobind, memoizeOne } from 'decorators';
import { visualizationDefaultProps } from 'components/visualizations/common/commonTypes';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type {
  BoxPlotBoxData,
  OutlierTooltipData,
} from 'components/ui/visualizations/BoxPlot/types';
import type {
  VisualizationDefaultProps,
  VisualizationProps,
} from 'components/visualizations/common/commonTypes';

type Props = VisualizationProps<'BOX_PLOT'>;

// Find the dimension levels that can be represented in the box plot for this
// query.
function getSelectableDimensions(
  groupBySettings: GroupBySettings,
): $ReadOnlyArray<string> {
  return groupBySettings
    .groupings()
    .values()
    .map(g => g.id())
    .filter(id => id !== 'nation');
}

function selectableDimensionsChanged(
  selectableDimensions: $ReadOnlyArray<string>,
  prevSelectableDimensions: $ReadOnlyArray<string>,
): boolean {
  if (selectableDimensions.length !== prevSelectableDimensions.length) {
    return true;
  }

  return selectableDimensions.every(
    (d, idx) => d === prevSelectableDimensions[idx],
  );
}

export default class BoxPlot extends React.PureComponent<Props> {
  static defaultProps: VisualizationDefaultProps<'BOX_PLOT'> = {
    ...visualizationDefaultProps,
    queryResult: BoxPlotQueryResultData.create({}),
  };

  componentDidMount() {
    const { groupBySettings } = this.props;
    this.updateSelectedDimension(getSelectableDimensions(groupBySettings), []);
  }

  componentDidUpdate(prevProps: Props) {
    const { groupBySettings } = this.props;
    if (prevProps.groupBySettings === groupBySettings) {
      return;
    }
    const selectableDimensions = getSelectableDimensions(groupBySettings);
    const prevSelectableDimensions = getSelectableDimensions(
      prevProps.groupBySettings,
    );
    const dimensionsHaveChanged = selectableDimensionsChanged(
      selectableDimensions,
      prevSelectableDimensions,
    );
    if (!dimensionsHaveChanged) {
      return;
    }

    this.updateSelectedDimension(
      selectableDimensions,
      prevSelectableDimensions,
    );
  }

  // HACK(stephen): We do not currently have an `updateFromNewGroupBySettings`
  // method yet, which makes handling changes to groupBySettings that affect
  // viz controls difficult. Right now, it is easier to update this specific
  // setting inside the viz.
  // TODO(stephen, pablo, anyone): Implement the `updateFromNewGroupBySettings`
  // method just like we have an `updateFromNewSeriesSettings` method.
  updateSelectedDimension(
    selectableDimensions: $ReadOnlyArray<string>,
    prevSelectableDimensions: $ReadOnlyArray<string>,
  ) {
    const { controls, onControlsSettingsChange } = this.props;
    const selectedDimension = controls.selectedDimension();

    // If there are no groupings to choose from, unset the selectedDimension.
    const count = selectableDimensions.length;
    if (count === 0) {
      onControlsSettingsChange('selectedDimension', undefined);
      return;
    }

    // Check to see if the selectedDimension still exists in the possible
    // dimensions. If it does, do nothing.
    if (selectableDimensions.includes(selectedDimension)) {
      return;
    }

    // If the selected dimension is not undefined, we can select the last
    // dimension in the list as the new value.
    const lastDimension = selectableDimensions[count - 1];
    if (selectedDimension !== undefined) {
      onControlsSettingsChange('selectedDimension', lastDimension);
      return;
    }

    // Hard part: determine if the `undefined` value that the user has selected
    // is by choice or was a default value that was selected by us here. If
    // the previous dimension count was 0, then we can assume the user does
    // not want to be at the "all" level. Also, if the first element in both
    // arrays does not match, then we can assume the query is sufficiently
    // different that the selected dimension should change to a non-undefined
    // value.
    if (
      prevSelectableDimensions.length === 0 ||
      selectableDimensions[0] !== prevSelectableDimensions[0]
    ) {
      onControlsSettingsChange('selectedDimension', lastDimension);
    }
  }

  @autobind
  formatDimensionValue(value: string): string {
    const { controls, groupBySettings } = this.props;
    const selectedDimension = controls.selectedDimension();
    if (selectedDimension === undefined) {
      return 'All';
    }

    const grouping = groupBySettings.groupings().get(selectedDimension);
    if (grouping === undefined) {
      return value;
    }

    return grouping.formatGroupingValue(value, true);
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
  formatMetricValue(value: number): string {
    const { controls, seriesSettings } = this.props;
    const seriesObject = seriesSettings.getSeriesObject(
      controls.selectedField(),
    );
    if (seriesObject === undefined) {
      return `${value}`;
    }
    return seriesObject.formatFieldValue(value);
  }

  @memoizeOne
  buildDataPoints(
    queryResult: BoxPlotQueryResultData,
    selectedField: string,
    selectedDimension: string | void,
    resultLimit: number,
  ): $ReadOnlyArray<BoxPlotBoxData> {
    return queryResult
      .getDataPoints(selectedField, selectedDimension)
      .slice(0, resultLimit);
  }

  getDataPoints(): $ReadOnlyArray<BoxPlotBoxData> {
    const { controls, queryResult } = this.props;
    return this.buildDataPoints(
      queryResult,
      controls.selectedField(),
      controls.selectedDimension(),
      controls.resultLimit(),
    );
  }

  @autobind
  maybeRenderBoxPlot(height: number, width: number): React.Node {
    const { axesSettings, controls, loading } = this.props;
    const { showDistribution, showOutliers, theme } = controls.modelValues();
    const dataPoints = this.getDataPoints();
    if (loading || dataPoints.length === 0) {
      return null;
    }

    return (
      <BoxPlotCore
        dimensionValueFormatter={this.formatDimensionValue}
        groups={dataPoints}
        height={height}
        metricValueFormatter={this.formatMetricValue}
        renderOutlierTooltip={this.renderOutlierTooltip}
        showOutliers={showOutliers}
        showViolinPatternLines={showDistribution}
        showViolinPlot={showDistribution}
        theme={BoxPlotTheme.Themes[theme]}
        width={width}
        xAxisLabel={axesSettings.xAxis().title()}
        yAxisLabel={axesSettings.y1Axis().title()}
      />
    );
  }

  @autobind
  renderOutlierTooltip(tooltipData: OutlierTooltipData): React.Node {
    const { left, top, dataPoint } = tooltipData;
    const { controls, groupBySettings, seriesSettings } = this.props;

    const rows = [];
    groupBySettings.groupings().forEach(grouping => {
      const dimensionValue = dataPoint.dimensions[grouping.id()];
      if (dimensionValue !== undefined) {
        rows.push({
          label: grouping.label() || '',
          value: grouping.formatGroupingValue(dimensionValue),
        });
      }
    });

    const seriesObject = seriesSettings.getSeriesObject(
      controls.selectedField(),
    );
    if (seriesObject !== undefined) {
      rows.push({
        label: seriesObject.label(),
        value: seriesObject.formatFieldValue(dataPoint.value),
      });
    }

    return <BoxPlotTooltip left={left} rows={rows} top={top} />;
  }

  render(): React.Node {
    return (
      <Visualization loading={this.props.loading}>
        {this.maybeRenderBoxPlot}
      </Visualization>
    );
  }
}
