// @flow

// List of colors to use for charts and markers. If there are more markers than
// colors, you should wrap around.
// Generated at http://phrogz.net/css/distinct-colors.html
export const PRIMARY_COLORS: { +[string]: string, ... } = {
  ZA_RED: '#D31F29',
  ZA_BLUE: '#003082',
  ZA_ORANGE: '#FF6600',
  ZA_GREY: '#999999',
  ZA_YELLOW: '#DD9B19',
  ZA_PURPLE: '#5F4994',
  ZA_GREEN: '#56997F',
  ZA_LIGHT_BLUE: '#82AEDE',
  ZA_DARK_BLUE: '#4D7CB7',
  RED: '#D13913',
  BRIGHT_RED: '#ff0000',
  ORANGE: '#E16512',
  TOMATO: '#FF6347',
  YELLOW: '#D99E0B',
  BRIGHT_YELLOW: '#ffff00',
  GREEN: '#29A634',
  BRIGHT_GREEN: '#008000',
  LIME: '#00FF00',
  CYAN: '#00B3A4',
  BLUE: '#2965CC',
  DEEP_SKY_BLUE: '#00BFFF',
  INDIGO: '#7157D9',
  VIOLET: '#8F398F',
  MAGENTA: '#DB2C6F',
};

export const LIGHT_PRIMARY_COLORS: { +[string]: string, ... } = {
  RED: '#EB9694',
  ORANGE: '#EBB48F',
  TOMATO: '#FFA190',
  YELLOW: '#F1CF79',
  GREEN: '#A0E5A6',
  LIME: '#7fff7f',
  CYAN: '#93ECE5',
  BLUE: '#BDD4FB',
  DEEP_SKY_BLUE: '#7FDFFF',
  INDIGO: '#D9D4EE',
  VIOLET: '#D4B8D4',
  MAGENTA: '#EEACC6',
};

export const SERIES_COLORS: $ReadOnlyArray<string> = [
  PRIMARY_COLORS.BLUE,
  PRIMARY_COLORS.GREEN,
  PRIMARY_COLORS.YELLOW,
  PRIMARY_COLORS.RED,
  PRIMARY_COLORS.CYAN,
  PRIMARY_COLORS.VIOLET,
  PRIMARY_COLORS.LIME,
  PRIMARY_COLORS.MAGENTA,
  PRIMARY_COLORS.ORANGE,
  PRIMARY_COLORS.INDIGO,
  PRIMARY_COLORS.TOMATO,
  PRIMARY_COLORS.DEEP_SKY_BLUE,
  PRIMARY_COLORS.BRIGHT_GREEN,
  PRIMARY_COLORS.BRIGHT_YELLOW,
  PRIMARY_COLORS.BRIGHT_RED,
  PRIMARY_COLORS.ZA_RED,
  PRIMARY_COLORS.ZA_BLUE,
  PRIMARY_COLORS.ZA_ORANGE,
  PRIMARY_COLORS.ZA_GREY,
  PRIMARY_COLORS.ZA_YELLOW,
  PRIMARY_COLORS.ZA_PURPLE,
  PRIMARY_COLORS.ZA_GREEN,
  PRIMARY_COLORS.ZA_LIGHT_BLUE,
  PRIMARY_COLORS.ZA_DARK_BLUE,
  LIGHT_PRIMARY_COLORS.BLUE,
  LIGHT_PRIMARY_COLORS.GREEN,
  LIGHT_PRIMARY_COLORS.YELLOW,
  LIGHT_PRIMARY_COLORS.RED,
  LIGHT_PRIMARY_COLORS.VIOLET,
  LIGHT_PRIMARY_COLORS.CYAN,
  LIGHT_PRIMARY_COLORS.MAGENTA,
  LIGHT_PRIMARY_COLORS.ORANGE,
  LIGHT_PRIMARY_COLORS.INDIGO,
  LIGHT_PRIMARY_COLORS.TOMATO,
  LIGHT_PRIMARY_COLORS.LIME,
  LIGHT_PRIMARY_COLORS.DEEP_SKY_BLUE,
];

// This is an interpolation from LIGHT_PRIMARY_COLORS to PRIMARY_COLORS
// based on http://gka.github.io/palettes
export const COLOR_GRADIENT: $ReadOnlyArray<string> = [
  '#eb9694',
  '#ebb48f',
  '#f1cf79',
  '#a0e5a6',
  '#93ece5',
  '#7fdfff',
  '#bdd4fb',
  '#d9d4ee',
  '#d4b8d4',
  '#e8857a',
  '#eba477',
  '#edc567',
  '#8cd990',
  '#7fe1d8',
  '#71d9ff',
  '#a5bdf2',
  '#c7baea',
  '#c79fc6',
  '#e47361',
  '#ea9561',
  '#e9bb54',
  '#76cc78',
  '#6ad5cb',
  '#62d2ff',
  '#8ca5e9',
  '#b4a1e6',
  '#ba86b8',
  '#df6148',
  '#e88549',
  '#e4b142',
  '#61c063',
  '#52cabd',
  '#4fcbff',
  '#728fdf',
  '#9f88e2',
  '#ab6daa',
  '#d84e2f',
  '#e57630',
  '#dea82b',
  '#48b34c',
  '#38beb1',
  '#38c6ff',
  '#5379d6',
  '#8a6fde',
  '#9d549d',
  '#d13913',
  '#e16512',
  '#d99e0b',
  '#29a634',
  '#00b3a4',
  '#00bfff',
  '#2965cc',
  '#7157d9',
  '#8f398f',
];

const CUSTOM_COLORS: $ReadOnlyArray<string> = window.__JSON_FROM_BACKEND.ui
  ? window.__JSON_FROM_BACKEND.ui.customColors
  : [];

export const PALETTE_COLOR_ORDER: $ReadOnlyArray<string> = [
  PRIMARY_COLORS.RED,
  PRIMARY_COLORS.ORANGE,
  PRIMARY_COLORS.YELLOW,
  PRIMARY_COLORS.GREEN,
  PRIMARY_COLORS.CYAN,
  PRIMARY_COLORS.DEEP_SKY_BLUE,
  PRIMARY_COLORS.BLUE,
  PRIMARY_COLORS.INDIGO,
  PRIMARY_COLORS.VIOLET,
  ...COLOR_GRADIENT,
  PRIMARY_COLORS.ZA_RED,
  PRIMARY_COLORS.ZA_BLUE,
  PRIMARY_COLORS.ZA_ORANGE,
  PRIMARY_COLORS.ZA_GREY,
  PRIMARY_COLORS.ZA_YELLOW,
  PRIMARY_COLORS.ZA_PURPLE,
  PRIMARY_COLORS.ZA_GREEN,
  PRIMARY_COLORS.ZA_LIGHT_BLUE,
  PRIMARY_COLORS.ZA_DARK_BLUE,
  ...CUSTOM_COLORS,
];

export type SortOrder = 'ASC' | 'DESC' | 'ALPH';

export const SORT_ASCENDING: 'ASC' = 'ASC';
export const SORT_DESCENDING: 'DESC' = 'DESC';
export const SORT_ALPHABETICAL: 'ALPH' = 'ALPH';

export const DEFAULT_SORT_ORDER: SortOrder = SORT_DESCENDING;

export const DISPLAY_DATE_FORMAT: string = 'D MMM YYYY';

// Create a mapping from field ID to color based on the ordering of the
// specified palette.
export function initializeFieldColors(
  fields: $ReadOnlyArray<string>,
  palette: $ReadOnlyArray<string> = SERIES_COLORS,
): { +[string]: string, ... } {
  const output = {};
  fields.forEach((f, idx) => {
    output[f] = palette[idx % palette.length];
  });
  return output;
}

/**
 * Given an index, return a corresponding series color
 */
export function indexToSeriesColor(idx: number): string {
  return SERIES_COLORS[idx % SERIES_COLORS.length];
}

/**
 * Given a set of already assigned colors, return the first available unassigned
 * series color
 *
 * @param {Set<string>} takenColors The set of already assigned colors
 * @returns {string | void} The first available unassigned color, or void if
 * there are no available series colors.
 */
export function getAvailableSeriesColor(
  takenColors: $ReadOnlySet<string>,
): string | void {
  for (let i = 0; i < SERIES_COLORS.length; i++) {
    const color = SERIES_COLORS[i];
    if (!takenColors.has(color)) {
      return color;
    }
  }
  return undefined;
}
