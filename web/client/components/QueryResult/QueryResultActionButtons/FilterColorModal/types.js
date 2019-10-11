// @flow

export type ColorActionOptionTextMap = {
  choose_option: string,
  color_top: string,
  color_bottom: string,
  color_above: string,
  color_below: string,
  color_above_average: string,
  color_below_average: string,
  preset_ranges: string,
  custom_ranges: string,
  true: string,
  false: string,
  values_equal_to_null: string,
};

export type RemoveActionOptionTextMap = {
  choose_option: string,
  remove_top: string,
  remove_bottom: string,
  remove_above: string,
  remove_below: string,
  remove_above_average: string,
  remove_below_average: string,
  remove_values_equal_to_zero: string,
  remove_values_equal_to_null: string,
};

export type RemoveActionOption = $Keys<RemoveActionOptionTextMap>;

export type ColorActionOption = $Keys<ColorActionOptionTextMap>;

export type ActionOption = RemoveActionOption | ColorActionOption;

export type FilterRule = {
  // this should be identified with an ActionType id, but instead we are
  // storing the action type's LABEL here instead of the ActionType instead.
  // It's too late to fix that now because a lot of dashboards have been stored
  // like this already.
  action: string,

  // the hex color for the color rule. If we selected a range (e.g. quartiles)
  // then this will be in `fieldRangeColor`
  actionColor?: string,
  actionOption?: ActionOption,
  actionValue?: string,

  // this is used just when converting the modal filters to
  // query result spec ColorFilter models
  actionLabel?: string,
};

export type FieldFilterSelections = {
  [ruleIdx: number]: FilterRule,
  fieldRangeColor?: Array<string>,
  fieldsMaxRange?: Array<string>,
  fieldsMinRange?: Array<string>,
  numRangeColorInputs?: number,
  numRangeOptionsInputs: number,
  rangeLabel?: Array<string>,
  usedOptions?: Array<ActionOption>,
};

export type FieldFilterSelectionsMap = {
  [fieldId: string]: FieldFilterSelections,
};
