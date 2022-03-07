// @flow
import * as React from 'react';

import ColorBlock from 'components/ui/ColorBlock';
import DataAction from 'models/core/QueryResultSpec/DataAction';
import DataActionGroup from 'models/core/QueryResultSpec/DataActionGroup';
import Group from 'components/ui/Group';
import QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import { getPixelValue } from 'util/stringUtil';
import type LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { StyleObject } from 'types/jsCore';

const MAX_DISPLAYED_FIELDS = 5;

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
    fontSize: legendSettings.legendFontSize(),
    fontFamily: legendSettings.legendFontFamily(),
    color: legendSettings.legendFontColor(),
    lineHeight: legendSettings.legendFontSize(),
  };
  const { seriesOrder, seriesObjects } = seriesSettings.modelValues();

  // respect series order when finding the series to display in the legend
  const displayedFieldIds = seriesOrder
    .filter(fieldId =>
      shouldDisplaySeries(
        seriesObjects[fieldId],
        seriesSettings.getSeriesDataActionGroup(fieldId),
      ),
    )
    .slice(0, MAX_DISPLAYED_FIELDS);
  if (displayedFieldIds.length === 0) {
    return null;
  }
  const renderColorRule = (
    colorAction: DataAction,
    values: $ReadOnlyArray<?number>,
  ) => {
    const label = colorAction.label() || colorAction.getRuleString(values);
    return (
      <Group.Horizontal key={label} spacing="xxs" paddingBottom="xxs">
        <ColorBlock
          color={colorAction.color()}
          size={getPixelValue(legendSettings.legendFontSize())}
        />
        <div style={textStyle}>{label}</div>
      </Group.Horizontal>
    );
  };

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

  return (
    <Group.Vertical marginTop="s" paddingLeft="l" spacing="xxxs">
      {legendRows}
    </Group.Vertical>
  );
}
