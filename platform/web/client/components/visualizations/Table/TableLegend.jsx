// @flow
import * as React from 'react';

import ColorBlock from 'components/ui/ColorBlock';
import DataAction from 'models/core/QueryResultSpec/DataAction';
import DataActionGroup from 'models/core/QueryResultSpec/DataActionGroup';
import Group from 'components/ui/Group';
import QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import Tooltip from 'components/ui/Tooltip';
import { getPixelValue } from 'util/stringUtil';
import type LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { StyleObject } from 'types/jsCore';

type Props = {
  legendSettings: LegendSettings,
  seriesSettings: SeriesSettings,
  seriesValues: { [fieldId: string]: $ReadOnlyArray<?number> },
};

function shouldDisplaySeries(
  series: QueryResultSeries,
  dataActionGroup: DataActionGroup,
): boolean {
  return series.isVisible() && dataActionGroup.dataActions().size() > 0;
}

export default function TableLegend({
  legendSettings,
  seriesSettings,
  seriesValues,
}: Props): React.Node {
  if (Object.keys(seriesValues).length === 0) {
    return null;
  }
  const textStyle: StyleObject = {
    color: legendSettings.legendFontColor(),
    fontFamily: legendSettings.legendFontFamily(),
    fontSize: legendSettings.legendFontSize(),
    lineHeight: legendSettings.legendFontSize(),
  };
  const { seriesObjects, seriesOrder } = seriesSettings.modelValues();

  // respect series order when finding the series to display in the legend
  const displayedFieldIds = seriesOrder.filter(fieldId =>
    shouldDisplaySeries(
      seriesObjects[fieldId],
      seriesSettings.getSeriesDataActionGroup(fieldId),
    ),
  );

  if (displayedFieldIds.length === 0) {
    return null;
  }
  const renderColorRule = (
    colorAction: DataAction,
    values: $ReadOnlyArray<?number>,
  ) => {
    const label = colorAction.label() || colorAction.getRuleString(values);
    return (
      <Group.Horizontal key={label} paddingBottom="xxs" spacing="xxs">
        <ColorBlock
          color={colorAction.color()}
          size={getPixelValue(legendSettings.legendFontSize())}
        />
        <div style={textStyle}>{label}</div>
      </Group.Horizontal>
    );
  };

  // get data action rules that have some displayed field ids.
  const displayedDataActionRules = seriesSettings
    .dataActionRules()
    .filter(rule =>
      displayedFieldIds.some(fieldId => [...rule.series()].includes(fieldId)),
    );

  // group the different indicators or series with same fieldDataActionGroup.
  const legendRowGroups = displayedDataActionRules.reduce(
    (prev, dataActionRule) => {
      const groupedLegendRows = prev;

      const legendRowkey = [...dataActionRule.series()].join('-');
      const seriesLabels = [];
      dataActionRule.series().forEach(serie => {
        if (seriesObjects[serie] !== undefined) {
          seriesLabels.push(seriesObjects[serie].label());
        }
      });

      if (groupedLegendRows[legendRowkey]) {
        groupedLegendRows[legendRowkey].dataActionRules = [
          ...(groupedLegendRows[legendRowkey].dataActionRules || []),
          ...dataActionRule.dataActions(),
        ];
      } else {
        groupedLegendRows[legendRowkey] = {
          seriesLabels,
          dataActionRules: [...dataActionRule.dataActions()],
          series: dataActionRule.series(),
        };
      }

      return groupedLegendRows;
    },
    {},
  );

  const legendRows = displayedFieldIds.map(fieldId => {
    const fieldDataActionGroup = seriesSettings.getSeriesDataActionGroup(
      fieldId,
    );
    if (!fieldDataActionGroup) {
      return null;
    }
    return (
      <Group.Horizontal key={fieldId}>
        <div style={textStyle}>{seriesObjects[fieldId].label()}:</div>
        {fieldDataActionGroup
          .dataActions()
          .mapValues(action => renderColorRule(action, seriesValues[fieldId]))}
      </Group.Horizontal>
    );
  });

  // sort maintains the order of displayedFieldIds when rendering the legend
  const consolidatedlegendRows = Object.keys(legendRowGroups)
    .sort((a, b) => displayedFieldIds.indexOf(a) - displayedFieldIds.indexOf(b))
    .map(legendRowkey => {
      const groupTotal = legendRowGroups[legendRowkey].seriesLabels.length;
      const label =
        groupTotal > 1
          ? `Applied to ${groupTotal} series`
          : legendRowGroups[legendRowkey].seriesLabels[0];
      return (
        <Group.Horizontal key={legendRowkey}>
          <Tooltip
            content={legendRowGroups[legendRowkey].seriesLabels.join(', ')}
            forceHideTooltip={groupTotal < 2}
            tooltipPlacement="right"
          >
            <div style={textStyle}>{label}:</div>
          </Tooltip>
          {legendRowGroups[legendRowkey].dataActionRules.map(action =>
            renderColorRule(
              action,
              seriesValues[
                legendRowGroups[legendRowkey].series.values().next().value
              ],
            ),
          )}
        </Group.Horizontal>
      );
    });

  // NOTE If marginTop changed, components/ui/visualizations/Table/index.jsx newHeight to be updated
  return (
    <Group.Vertical marginTop="s" paddingLeft="l" spacing="xxxs">
      {legendSettings.consolidateRules() ? consolidatedlegendRows : legendRows}
    </Group.Vertical>
  );
}
