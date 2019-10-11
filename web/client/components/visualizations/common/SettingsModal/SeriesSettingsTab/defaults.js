// @flow
import { RESULT_VIEW_TYPES } from 'components/QueryResult/common';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { SeriesBlockOptions } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab';

// eslint-disable-next-line import/prefer-default-export
export function getSeriesSettingsOptions(
  viewType: ResultViewType,
  extraOptions: { displayAdvancedSettings: boolean } = {},
): $Shape<SeriesBlockOptions> | null {
  switch (viewType) {
    case RESULT_VIEW_TYPES.CHART:
      return {
        canEditColor: true,
        canEditDataLabelFormat: true,
        canEditDataLabelFontSize: true,
        canEditOrder: true,
        canEditYAxis: true,
        canToggleSeriesValue: true,
        canToggleVisibility: true,
      };
    case RESULT_VIEW_TYPES.BAR_GRAPH:
      return {
        canEditColor: true,
        canEditDataLabelFormat: true,
        canEditDataLabelFontSize: true,
        canEditOrder: true,
        canEditYAxis: true,
        // TODO(stephen): Enable this when it is supported.
        canToggleSeriesValue: false,
        canToggleVisibility: true,
      };
    case RESULT_VIEW_TYPES.TIME:
      return {
        canEditYAxis: true,
        canToggleVisibility: true,
      };
    case RESULT_VIEW_TYPES.TABLE:
      return {
        canEditOrder: true,
        canEditDataLabelFormat: true,
        canToggleConstituents: !extraOptions.displayAdvancedSettings,
        canToggleVisibility: true,
      };
    case RESULT_VIEW_TYPES.GEOMAP:
      return {
        canEditSeriesLabel: false,
      };
    case RESULT_VIEW_TYPES.BUMP_CHART:
      return {
        canEditSeriesLabel: true,
        canEditDataLabelFormat: true,
      };
    default:
      return null;
  }
}
