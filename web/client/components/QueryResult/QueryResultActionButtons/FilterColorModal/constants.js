// @flow
import {
  PRIMARY_COLORS,
  LIGHT_PRIMARY_COLORS,
} from 'components/QueryResult/graphUtil';
import type {
  ActionOption,
  ColorActionOptionTextMap,
  RemoveActionOptionTextMap,
} from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/types';

const TEXT = t('query_form.filters');

export const COLOR_BLOCK_SIZE = 27;

// If user picks remove, these are the actions remove is available to do.
export const REMOVE_ACTIONS: RemoveActionOptionTextMap = {
  choose_option: TEXT.choose_option,
  remove_top: TEXT.remove_top,
  remove_bottom: TEXT.remove_bottom,
  remove_above: TEXT.remove_above,
  remove_below: TEXT.remove_below,
  remove_above_average: TEXT.remove_above_average,
  remove_below_average: TEXT.remove_below_average,
  remove_values_equal_to_zero: TEXT.remove_values_equal_to_zero,
  remove_values_equal_to_null: TEXT.remove_values_equal_to_null,
};

// If user picks color, these are the actions color is available to do.
export const COLOR_ACTIONS: ColorActionOptionTextMap = {
  choose_option: TEXT.choose_option,
  color_top: TEXT.remove_top,
  color_bottom: TEXT.remove_bottom,
  color_above: TEXT.remove_above,
  color_below: TEXT.remove_below,
  color_above_average: TEXT.remove_above_average,
  color_below_average: TEXT.remove_below_average,
  preset_ranges: TEXT.preset_ranges,
  custom_ranges: TEXT.custom_ranges,
  true: TEXT.remove_true,
  false: TEXT.remove_false,
  values_equal_to_null: TEXT.remove_values_equal_to_null,
};

// The keys are options that when selected, their key-value is also disabled.
// Only disabling because we aren't sure how to handle the hierarchy of them.
const EXCLUSIVE_OPTION_GROUPS = [
  ['preset_ranges', 'custom_ranges'],
  ['remove_above', 'remove_above_average', 'remove_top'],
  ['remove_below', 'remove_below_average', 'remove_bottom'],
];

// Map from each element in an array (in EXCLUSIVE_OPTION_GROUPS) to the rest
// of the array it's contained in.
export const EXCLUSIVE_OPTIONS: { [ActionOption]: Array<ActionOption> } = {};

EXCLUSIVE_OPTION_GROUPS.forEach(group => {
  group.forEach(curOption => {
    EXCLUSIVE_OPTIONS[curOption] = group.filter(o => o !== curOption);
  });
});

export const PRESET_COLOR_ORDER: Array<string> = [
  PRIMARY_COLORS.GREEN,
  LIGHT_PRIMARY_COLORS.GREEN,
  PRIMARY_COLORS.YELLOW,
  PRIMARY_COLORS.ORANGE,
  PRIMARY_COLORS.RED,
  LIGHT_PRIMARY_COLORS.RED,
  PRIMARY_COLORS.CYAN,
  PRIMARY_COLORS.BLUE,
  PRIMARY_COLORS.VIOLET,
  PRIMARY_COLORS.MAGENTA,
];
