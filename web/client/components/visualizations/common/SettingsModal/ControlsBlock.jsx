// @flow
import * as React from 'react';

import BarGraphControlsBlock from 'components/visualizations/BarGraph/BarGraphControlsBlock';
import BoxPlotControlsBlock from 'components/visualizations/BoxPlot/BoxPlotControlsBlock';
import BubbleChartControlsBlock from 'components/visualizations/BubbleChart/BubbleChartControlsBlock';
import BumpChartControlsBlock from 'components/visualizations/BumpChart/BumpChartControlsBlock';
import ExpandoTreeControlsBlock from 'components/visualizations/ExpandoTree/ExpandoTreeControlsBlock';
import HeatTilesControlsBlock from 'components/visualizations/HeatTiles/HeatTilesControlsBlock';
import HistogramControlsBlock from 'components/visualizations/Histogram/HistogramControlsBlock';
import LineGraphControlsBlock from 'components/visualizations/LineGraph/LineGraphControlsBlock';
import MapControlsBlock from 'components/visualizations/MapViz/MapControlsBlock';
import NumberTrendControlsBlock from 'components/visualizations/NumberTrend/NumberTrendControlsBlock';
import PieChartControlsBlock from 'components/visualizations/PieChart/PieChartControlsBlock';
import SunburstControlsBlock from 'components/visualizations/Sunburst/SunburstControlsBlock';
import TableControlsBlock from 'components/visualizations/Table/TableControlsBlock';
import type Field from 'models/core/wip/Field';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type Props = {
  onQueryResultSpecChange: QueryResultSpec => void,
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections,
  viewType: ResultViewType,
};

export default function ControlsBlock({
  onQueryResultSpecChange,
  querySelections,
  queryResultSpec,
  viewType,
}: Props): React.MixedElement | null {
  const dataFilters = queryResultSpec.dataFilters();
  const seriesSettings = queryResultSpec.getSeriesSettings(viewType);
  const groupBySettings = queryResultSpec.groupBySettings();
  const onVizControlChange = React.useCallback(
    (controlKey, value) => {
      const newSpec = queryResultSpec.updateVisualizationControlValue(
        viewType,
        controlKey,
        value,
      );
      onQueryResultSpecChange(newSpec);
    },
    [queryResultSpec, viewType, onQueryResultSpecChange],
  );

  const allFields = React.useMemo(() => {
    const selectedFields: $ReadOnlyArray<Field> = querySelections
      .fields()
      .arrayView();

    return selectedFields.concat(queryResultSpec.customFields());
  }, [querySelections, queryResultSpec]);

  switch (viewType) {
    case 'BAR_GRAPH':
      return (
        <BarGraphControlsBlock
          controls={queryResultSpec.getVisualizationControls(viewType)}
          dataFilters={dataFilters}
          fields={allFields}
          groupBySettings={groupBySettings}
          onControlsSettingsChange={onVizControlChange}
        />
      );

    case 'BOX_PLOT':
      return (
        <BoxPlotControlsBlock
          controls={queryResultSpec.getVisualizationControls(viewType)}
          dataFilters={dataFilters}
          fields={allFields}
          groupBySettings={groupBySettings}
          onControlsSettingsChange={onVizControlChange}
        />
      );

    case 'BUBBLE_CHART':
      return (
        <BubbleChartControlsBlock
          controls={queryResultSpec.getVisualizationControls(viewType)}
          dataFilters={dataFilters}
          fields={allFields}
          groupBySettings={groupBySettings}
          seriesSettings={seriesSettings}
          onControlsSettingsChange={onVizControlChange}
        />
      );

    case 'BUMP_CHART':
      return (
        <BumpChartControlsBlock
          controls={queryResultSpec.getVisualizationControls(viewType)}
          dataFilters={dataFilters}
          fields={allFields}
          groupBySettings={groupBySettings}
          onControlsSettingsChange={onVizControlChange}
        />
      );

    case 'EPICURVE':
      return (
        <HistogramControlsBlock
          controls={queryResultSpec.getVisualizationControls(viewType)}
          dataFilters={dataFilters}
          fields={allFields}
          groupBySettings={groupBySettings}
          onControlsSettingsChange={onVizControlChange}
          seriesSettings={seriesSettings}
        />
      );

    case 'EXPANDOTREE':
      return (
        <ExpandoTreeControlsBlock
          controls={queryResultSpec.getVisualizationControls(viewType)}
          dataFilters={dataFilters}
          fields={allFields}
          groupBySettings={groupBySettings}
          onControlsSettingsChange={onVizControlChange}
        />
      );

    case 'HEATTILES':
      return (
        <HeatTilesControlsBlock
          controls={queryResultSpec.getVisualizationControls(viewType)}
          dataFilters={dataFilters}
          fields={allFields}
          groupBySettings={groupBySettings}
          onControlsSettingsChange={onVizControlChange}
        />
      );

    case 'MAP':
      return (
        <MapControlsBlock
          controls={queryResultSpec.getVisualizationControls(viewType)}
          dataFilters={dataFilters}
          fields={allFields}
          groupBySettings={groupBySettings}
          seriesSettings={seriesSettings}
          onControlsSettingsChange={onVizControlChange}
        />
      );

    case 'NUMBER_TREND':
      return (
        <NumberTrendControlsBlock
          controls={queryResultSpec.getVisualizationControls(viewType)}
          dataFilters={dataFilters}
          fields={allFields}
          groupBySettings={groupBySettings}
          onControlsSettingsChange={onVizControlChange}
        />
      );

    case 'PIE':
      return (
        <PieChartControlsBlock
          controls={queryResultSpec.getVisualizationControls(viewType)}
          dataFilters={dataFilters}
          fields={allFields}
          groupBySettings={groupBySettings}
          onControlsSettingsChange={onVizControlChange}
        />
      );

    case 'SUNBURST':
      return (
        <SunburstControlsBlock
          controls={queryResultSpec.getVisualizationControls(viewType)}
          dataFilters={dataFilters}
          fields={allFields}
          groupBySettings={groupBySettings}
          onControlsSettingsChange={onVizControlChange}
        />
      );

    case 'TABLE':
      return (
        <TableControlsBlock
          controls={queryResultSpec.getVisualizationControls(viewType)}
          dataFilters={dataFilters}
          fields={allFields}
          groupBySettings={groupBySettings}
          onControlsSettingsChange={onVizControlChange}
        />
      );

    case 'TIME':
      return (
        <LineGraphControlsBlock
          controls={queryResultSpec.getVisualizationControls(viewType)}
          dataFilters={dataFilters}
          fields={allFields}
          groupBySettings={groupBySettings}
          seriesSettings={seriesSettings}
          onControlsSettingsChange={onVizControlChange}
        />
      );

    default:
      (viewType: empty);
      if (__DEV__) {
        throw new Error(
          `[ControlsBlock] received unhandled view type '${viewType}'`,
        );
      }
      return null;
  }
}
