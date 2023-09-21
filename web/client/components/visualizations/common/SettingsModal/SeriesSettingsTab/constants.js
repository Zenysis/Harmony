// @flow
import I18N from 'lib/I18N';

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
  headerName: string,
  type: SeriesSettingsType,
};

export const SERIES_SETTINGS_CONFIG: $ReadOnlyArray<SeriesSettingConfig> = [
  {
    headerName: '',
    type: 'order',
  },
  {
    headerName: '',
    type: 'color',
  },
  {
    headerName: '',
    type: 'isVisible',
  },
  {
    headerName: I18N.text('Series label', 'seriesLabel'),
    type: 'seriesLabel',
  },
  {
    headerName: I18N.text('Show value', 'showSeriesValue'),
    type: 'showSeriesValue',
  },
  {
    headerName: I18N.text('Value display format', 'dataLabelFormat'),
    type: 'dataLabelFormat',
  },
  {
    headerName: I18N.text('Value font size', 'dataLabelFontSize'),
    type: 'dataLabelFontSize',
  },
  {
    headerName: I18N.text('Y-Axis', 'yAxis'),
    type: 'yAxis',
  },
  {
    headerName: I18N.text('Visual style', 'visualDisplayShape'),
    type: 'visualDisplayShape',
  },
  {
    headerName: I18N.text('Add rules', 'colorActions'),
    type: 'colorActions',
  },
  {
    headerName: I18N.text('Bar value position', 'barLabelPosition'),
    type: 'barLabelPosition',
  },
];
