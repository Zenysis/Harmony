// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import SimpleLegend from 'components/ui/visualizations/MapCore/SimpleLegend';
import SimpleLegendItem from 'components/ui/visualizations/MapCore/SimpleLegend/SimpleLegendItem';
import buildLabelLegendRows from 'components/visualizations/MapViz/QueryResultLayer/buildLabelLegendRows';
import type LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import type MapSettings from 'models/visualizations/MapViz/MapSettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { MapDataPoint } from 'models/visualizations/MapViz/types';
import type { RowData } from 'components/ui/visualizations/MapCore/SimpleLegend/SimpleLegendItem';

type Props = {
  className?: string,
  controls: MapSettings,
  dataPoints: $ReadOnlyArray<MapDataPoint>,
  disabledColorRules: Zen.Map<true>,
  disabledLabels: Zen.Map<true>,
  inputRows?: $ReadOnlyArray<RowData> | null,
  legendSettings: LegendSettings,
  onSelectColorRule: string => void,
  onSelectLabel: string => void,
  seriesSettings: SeriesSettings,
};

export default function QueryResultLayerLegend({
  className = '',
  controls,
  dataPoints,
  disabledColorRules,
  disabledLabels,
  inputRows = null,
  legendSettings,
  onSelectColorRule,
  onSelectLabel,
  seriesSettings,
}: Props): React.Element<typeof SimpleLegend> | null {
  const selectedField = controls.selectedField();

  const dataActionGroup = seriesSettings.getSeriesDataActionGroup(
    selectedField,
  );

  const allValues = React.useMemo<$ReadOnlyArray<number | null>>(
    () => dataPoints.map((d: MapDataPoint) => d.metrics[selectedField]),
    [dataPoints, selectedField],
  );

  const memoRows = React.useMemo<$ReadOnlyArray<RowData>>(() => {
    return dataActionGroup.dataActions().mapValues(dataAction => ({
      color: dataAction.color(),
      label: dataAction.label() || dataAction.getRuleString(allValues),
    }));
  }, [allValues, dataActionGroup]);

  const rows = inputRows !== null ? inputRows : memoRows;
  function maybeRenderLabelLegend() {
    const selectedLabelsToDisplay = controls.selectedLabelsToDisplay();

    if (
      !controls.showLabels() ||
      Object.keys(selectedLabelsToDisplay).length === 0
    ) {
      return null;
    }

    return (
      <SimpleLegendItem
        key="label-legend"
        disabledLegendIds={disabledLabels}
        onToggleLegend={onSelectLabel}
        rows={buildLabelLegendRows(selectedLabelsToDisplay)}
        symbolShape="square"
        title={t('query_result.map.labels_legend_title')}
      />
    );
  }

  function maybeRenderQueryResultLegend() {
    const seriesObject = seriesSettings.getSeriesObject(selectedField);

    // NOTE(stephen): Disabling the query result legend when the user is using
    // the heatmap since the heatmap viz can only show a single field at a time
    // AND the coloration is not controlled by the user through series settings.
    if (
      dataActionGroup === undefined ||
      seriesObject === undefined ||
      controls.currentDisplay() === 'heatmap'
    ) {
      return null;
    }

    return (
      <SimpleLegendItem
        key="query-result-legend"
        disabledLegendIds={disabledColorRules}
        onToggleLegend={onSelectColorRule}
        rows={rows}
        title={seriesObject.label()}
      />
    );
  }

  const children = [maybeRenderLabelLegend(), maybeRenderQueryResultLegend()];

  // Filtering out null values in a way that Flow can recognize
  const formattedChildren: $ReadOnlyArray<
    React.Element<typeof SimpleLegendItem>,
  > = children.filter(Boolean);

  if (formattedChildren.length === 0) {
    return null;
  }

  const style = {
    color: legendSettings.legendFontColor(),
    fontFamily: legendSettings.legendFontFamily(),
    fontSize: legendSettings.legendFontSize(),
  };

  return (
    <SimpleLegend className={className} style={style}>
      {formattedChildren}
    </SimpleLegend>
  );
}
