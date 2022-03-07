// @flow
import I18N from 'lib/I18N';

// Set display text for headers
const TEXT = t(
  'visualizations.common.SettingsModal.SeriesSettingsTab.tableHeaders',
);

export const ORDER = 'order';
export const COLOR = 'color';
export const IS_VISIBLE = 'isVisible';
export const SERIES_LABEL = 'seriesLabel';
export const DATA_LABEL_FORMAT = 'dataLabelFormat';
export const DATA_LABEL_FONT_SIZE = 'dataLabelFontSize';
export const SHOW_VALUE = 'showSeriesValue';
export const Y_AXIS = 'yAxis';
export const DATA_ACTIONS = 'dataActions';
export const BAR_LABEL_POSITION = 'barLabelPosition';
export const VISUAL_DISPLAY_SHAPE = 'visualDisplayShape';

export type SeriesSettingsType =
  | 'order'
  | 'color'
  | 'isVisible'
  | 'seriesLabel'
  | 'dataLabelFormat'
  | 'dataLabelFontSize'
  | 'showSeriesValue'
  | 'yAxis'
  | 'colorActions'
  | 'barLabelPosition'
  | 'visualDisplayShape';

export type SeriesSettingConfig = {
  type: SeriesSettingsType,
  headerName: string,
};

export const SERIES_SETTINGS_CONFIG: $ReadOnlyArray<SeriesSettingConfig> = [
  {
    type: 'order',
    headerName: '',
  },
  {
    type: 'color',
    headerName: '',
  },
  {
    type: 'isVisible',
    headerName: '',
  },
  {
    type: 'seriesLabel',
    headerName: TEXT.seriesLabel,
  },
  {
    type: 'showSeriesValue',
    headerName: TEXT.showSeriesValue,
  },
  {
    type: 'dataLabelFormat',
    headerName: TEXT.dataLabelFormat,
  },
  {
    type: 'dataLabelFontSize',
    headerName: TEXT.dataLabelFontSize,
  },
  {
    type: 'yAxis',
    headerName: TEXT.yAxis,
  },
  {
    type: 'visualDisplayShape',
    headerName: TEXT.visualDisplay,
  },
  {
    type: 'colorActions',
    headerName: I18N.text('Add rules', 'colorActions'),
  },
  {
    type: 'barLabelPosition',
    headerName: TEXT.barLabelPosition,
  },
];
