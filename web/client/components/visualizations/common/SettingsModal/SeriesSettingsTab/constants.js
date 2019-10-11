// @flow
import type { TableHeader } from 'components/ui/Table';

export type SeriesRowData = {
  seriesId: string,
  idx: number,
};

export type SeriesTableHeader = TableHeader<SeriesRowData> & {
  propKey: string,
};

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
export const SHOW_CONSTITUENTS = 'showConstituents';
export const SHOW_VALUE = 'showSeriesValue';
export const Y_AXIS = 'yAxis';

export const TABLE_HEADERS: $ReadOnlyArray<SeriesTableHeader> = [
  {
    id: ORDER,
    propKey: 'canEditOrder',
    headerClassName: 'order',
    displayContent: '',
  },
  {
    id: COLOR,
    propKey: 'canEditColor',
    headerClassName: 'color',
    displayContent: '',
  },
  {
    id: IS_VISIBLE,
    propKey: 'canToggleVisibility',
    headerClassName: 'isVisible',
    displayContent: '',
  },
  {
    id: SERIES_LABEL,
    propKey: 'canEditSeriesLabel',
    headerClassName: 'seriesLabel',
    displayContent: TEXT[SERIES_LABEL],
  },
  {
    id: SHOW_CONSTITUENTS,
    propKey: 'canToggleConstituents',
    headerClassName: 'showConstituents',
    displayContent: TEXT[SHOW_CONSTITUENTS],
  },
  {
    id: SHOW_VALUE,
    propKey: 'canToggleSeriesValue',
    headerClassName: 'showSeriesValue',
    displayContent: TEXT[SHOW_VALUE],
  },
  {
    id: DATA_LABEL_FORMAT,
    propKey: 'canEditDataLabelFormat',
    headerClassName: 'dataLabelFormat',
    displayContent: TEXT[DATA_LABEL_FORMAT],
  },
  {
    id: DATA_LABEL_FONT_SIZE,
    propKey: 'canEditDataLabelFontSize',
    headerClassName: 'dataLabelFontSize',
    displayContent: TEXT[DATA_LABEL_FONT_SIZE],
  },
  {
    id: Y_AXIS,
    propKey: 'canEditYAxis',
    headerClassName: 'yAxis',
    displayContent: TEXT[Y_AXIS],
  },
];
