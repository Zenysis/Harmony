// @flow
import * as React from 'react';

import {
  VISUALIZATION_INFO,
  VISUALIZATION_TO_VIEW_TYPE,
} from 'models/AdvancedQueryApp/VisualizationType/registry';
import type DashboardItemHolder from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';
import type DashboardQueryItem from 'models/DashboardBuilderApp/DashboardItem/DashboardQueryItem';

/**
 * Extract the title of the visualization held by this DashboardQueryItem.
 * Include the visualization type as the suffix of the title.
 *
 * NOTE(stephen): This is primarily based off the `getTitle` function in the
 * legacy DashboardQuery model.
 */
function buildQueryItemTitle(item: DashboardQueryItem): string {
  const queryResultSpec = item.queryResultSpec();
  const visualizationType = item.visualizationType();
  const vizTypeInfo = VISUALIZATION_INFO[visualizationType] || {};
  const vizTypeName = vizTypeInfo.name || '';

  // If there is an explicitly set title then we use that
  const titleSettingsTitle = queryResultSpec.titleSettings().title();
  if (titleSettingsTitle.length > 0) {
    return `${titleSettingsTitle} ${vizTypeName}`;
  }

  // Otherwise we use a title based on the fields selected
  const viewType = VISUALIZATION_TO_VIEW_TYPE[visualizationType];
  const seriesSettings = queryResultSpec.getSeriesSettings(viewType);
  const vizControls = queryResultSpec.getVisualizationControls(viewType);

  // Figure out which field ID is used for the title. Some visualizations use
  // a custom field for the title, while others default to the first visible
  // field in the series settings.
  const titleFieldId =
    vizControls.getTitleField() || seriesSettings.visibleSeriesOrder()[0];

  // Find the series object for the title field, if it exists.
  // NOTE(stephen): It should not be possible for it to be undefined, but we
  // want to guard for it just in case. There is no reason to crash if we can't
  // produce a good title since it is of very low value.
  const seriesObject = seriesSettings.getSeriesObject(titleFieldId);
  if (seriesObject === undefined) {
    return `<> ${vizTypeName}`;
  }

  return `${seriesObject.label()} ${vizTypeName}`;
}

/**
 * Build a mapping from query tile ID to the the title of the query tile that
 * the user will see on the dashboard.
 */
export default function useDashboardQueryItemTitles(
  itemHolders: $ReadOnlyArray<DashboardItemHolder>,
): { +[string]: string } {
  return React.useMemo(() => {
    const output = {};
    itemHolders.forEach(itemHolder => {
      const item = itemHolder.item();
      if (item.tag !== 'QUERY_ITEM') {
        return;
      }

      output[itemHolder.id()] = buildQueryItemTitle(item);
    });

    return output;
  }, [itemHolders]);
}
