// @flow
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

// an object that stores which settings are enabled for this tab
export type EnabledSeriesSettingsConfig = {
  +barLabelPosition: boolean,
  +color: boolean,
  +colorActions: boolean,
  +dataLabelFontSize: boolean,
  +dataLabelFormat: boolean,
  +isVisible: boolean,
  +order: boolean,
  +seriesLabel: boolean,
  +showSeriesValue: boolean,
  +visualDisplayShape: boolean,
  +yAxis: boolean,
};

const DEFAULT_SERIES_SETTINGS_OPTIONS: EnabledSeriesSettingsConfig = {
  barLabelPosition: false,
  color: false,
  colorActions: false,
  dataLabelFontSize: false,
  dataLabelFormat: true,
  isVisible: false,
  order: false,
  seriesLabel: true,
  showSeriesValue: false,
  visualDisplayShape: false,
  yAxis: false,
};

// eslint-disable-next-line import/prefer-default-export
export function getSeriesSettingsOptions(
  viewType: ResultViewType,
): EnabledSeriesSettingsConfig {
  switch (viewType) {
    case RESULT_VIEW_TYPES.BAR_GRAPH:
      return {
        ...DEFAULT_SERIES_SETTINGS_OPTIONS,
        barLabelPosition: true,
        color: true,
        dataLabelFontSize: true,
        isVisible: true,
        order: true,
        showSeriesValue: true,
        visualDisplayShape: true,
        yAxis: true,
      };
    case RESULT_VIEW_TYPES.EPICURVE:
      return {
        ...DEFAULT_SERIES_SETTINGS_OPTIONS,
        barLabelPosition: true,
        dataLabelFontSize: true,
        isVisible: true,
        order: true,
        showSeriesValue: true,
        visualDisplayShape: true,
      };
    case RESULT_VIEW_TYPES.TIME:
      return {
        ...DEFAULT_SERIES_SETTINGS_OPTIONS,
        dataLabelFontSize: true,
        isVisible: true,
        order: true,
        showSeriesValue: true,
        yAxis: true,
      };
    case RESULT_VIEW_TYPES.TABLE:
      return {
        ...DEFAULT_SERIES_SETTINGS_OPTIONS,
        colorActions: true,
        isVisible: true,
        order: true,
      };
    case RESULT_VIEW_TYPES.MAP:
      return {
        ...DEFAULT_SERIES_SETTINGS_OPTIONS,
        colorActions: true,
        isVisible: true,
      };
    case RESULT_VIEW_TYPES.BUBBLE_CHART:
      return {
        ...DEFAULT_SERIES_SETTINGS_OPTIONS,
        colorActions: true,
        dataLabelFormat: false,
      };
    case RESULT_VIEW_TYPES.BUMP_CHART:
      return {
        ...DEFAULT_SERIES_SETTINGS_OPTIONS,
        seriesLabel: true,
      };
    case RESULT_VIEW_TYPES.NUMBER_TREND:
      return {
        ...DEFAULT_SERIES_SETTINGS_OPTIONS,
        colorActions: true,
      };
    case RESULT_VIEW_TYPES.PIE:
      return {
        ...DEFAULT_SERIES_SETTINGS_OPTIONS,
        dataLabelFormat: false,
        isVisible: true,
        order: true,
      };
    case RESULT_VIEW_TYPES.HEATTILES:
      return {
        ...DEFAULT_SERIES_SETTINGS_OPTIONS,
        dataLabelFormat: false,
      };
    case RESULT_VIEW_TYPES.SUNBURST:
      return {
        ...DEFAULT_SERIES_SETTINGS_OPTIONS,
        dataLabelFormat: false,
      };
    default:
      return DEFAULT_SERIES_SETTINGS_OPTIONS;
  }
}
