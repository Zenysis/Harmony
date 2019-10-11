// @flow
import * as Zen from 'lib/Zen';
import ValueRuleUtil from 'models/core/QueryResultSpec/ValueRule/ValueRuleUtil';
import type { FilterRule } from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/types';
import type {
  TestableRule,
  ValueRule,
} from 'models/core/QueryResultSpec/ValueRule/types';

type Values = {
  rule: ValueRule & TestableRule,
  color: string,
};

type DefaultValues = {
  label: string | void,
};

/**
 * TODO(pablo): remove this once the Filter/Color modal no longer creates
 * the legacy filter selection types
 * @deprecated
 */
function _isLegacyColorAction(filterModalRule: FilterRule) {
  const { actionOption } = filterModalRule;
  if (actionOption) {
    return (
      actionOption === 'color_top' ||
      actionOption === 'color_bottom' ||
      actionOption === 'color_above' ||
      actionOption === 'color_below' ||
      actionOption === 'color_above_average' ||
      actionOption === 'color_below_average' ||
      actionOption === 'preset_ranges' ||
      actionOption === 'custom_ranges' ||
      actionOption === 'true' ||
      actionOption === 'false' ||
      actionOption === 'values_equal_to_null'
    );
  }
  return false;
}

/**
 * This stores a rule to test some data with, and what color any value passing
 * that rule should be assigned.
 */
class ColorAction extends Zen.BaseModel<ColorAction, Values, DefaultValues> {
  static defaultValues = {
    label: undefined,
  };

  static createFromFilterModalSelections(
    filterModalRule: FilterRule,
  ): Zen.Model<ColorAction> | void {
    const { actionColor, actionLabel } = filterModalRule;
    if (
      _isLegacyColorAction(filterModalRule) &&
      actionColor !== undefined &&
      actionColor !== ''
    ) {
      return ColorAction.create({
        rule: ValueRuleUtil.createFromLegacyFilterRule(filterModalRule),
        color: actionColor,
        label: actionLabel,
      });
    }
    return undefined;
  }
}

export default ((ColorAction: any): Class<Zen.Model<ColorAction>>);
