// @flow
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

// an object that stores which settings are enabled for this tab
export type EnabledSeriesSettingsConfig = {
  +colorActions: boolean,
  +order: boolean,
  +dataLabelFormat: boolean,
  +dataLabelFontSize: boolean,
  +seriesLabel: boolean,
  +yAxis: boolean,
  +color: boolean,
  +showSeriesValue: boolean,
  +isVisible: boolean,
  +barLabelPosition: boolean,
  +visualDisplayShape: boolean,
};

const DEFAULT_SERIES_SETTINGS_OPTIONS: EnabledSeriesSettingsConfig = {
  colorActions: false,
  dataLabelFormat: true,
  dataLabelFontSize: false,
  order: false,
  seriesLabel: true,
  yAxis: false,
  color: false,
  showSeriesValue: false,
  isVisible: false,
  barLabelPosition: false,
  visualDisplayShape: false,
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
        order: true,
        yAxis: true,
        showSeriesValue: true,
        isVisible: true,
        visualDisplayShape: true,
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
        order: true,
        showSeriesValue: true,
        yAxis: true,
        isVisible: true,
      };
    case RESULT_VIEW_TYPES.TABLE:
      return {
        ...DEFAULT_SERIES_SETTINGS_OPTIONS,
        colorActions: true,
        order: true,
        isVisible: true,
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
