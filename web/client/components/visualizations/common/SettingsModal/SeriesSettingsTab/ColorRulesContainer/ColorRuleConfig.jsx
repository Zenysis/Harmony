// @flow
import * as React from 'react';

import DataActionRulesDispatch from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import InputText from 'components/ui/InputText';
import {
  isSingleValueColorRule,
  isSimpleColorRule,
  isQuantileColorRule,
  isValueRangeColorRule,
} from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';
import type {
  ColorRuleTemplate,
  ColorRuleType,
} from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';

const TEXT = t(
  'visualizations.common.SettingsModal.SeriesSettingsTab.ColorRulesContainer.ColorRuleConfig',
);

const QUANTILES = [2, 3, 4, 5, 10];
const QUANTILE_OPTIONS = QUANTILES.map(q => (
  <Dropdown.Option key={q} value={q}>
    {TEXT[String(q)]}
  </Dropdown.Option>
));

const COLOR_RULES_ORDER: $ReadOnlyArray<ColorRuleType> = [
  'TOP',
  'BOTTOM',
  'ABOVE_VALUE',
  'BELOW_VALUE',
  'ABOVE_AVERAGE',
  'BELOW_AVERAGE',
  'IN_QUANTILE',
  'IN_VALUE_RANGE',
  'IS_TRUE',
  'IS_FALSE',
  'EQUAL_TO_NULL',
];

const COLOR_RULE_OPTIONS = COLOR_RULES_ORDER.map(ruleKey => {
  return (
    <Dropdown.Option key={ruleKey} value={ruleKey}>
      {TEXT[ruleKey]}
    </Dropdown.Option>
  );
});

type Props = {
  rule: ColorRuleTemplate | void,
  ruleId: string,
};

/**
 * This component is rendered after the user selects the color rule to apply
 * (e.g. "bottom", "top", "preset ranges", etc.). This is the UI where the user
 * can change the basic configuration for a rule (e.g. what value we compare
 * by, or how many quantiles to set).
 */
export default function ColorRuleConfig({ rule, ruleId }: Props): React.Node {
  const dispatch = React.useContext(DataActionRulesDispatch);
  const onChangeRuleType = ruleType =>
    dispatch({
      ruleId,
      type: 'COLOR_RULE_TYPE_CHANGE',
      oldRule: rule,
      newRuleType: ruleType,
    });

  function renderRuleSpecificConfig() {
    if (rule === undefined) {
      return null;
    }

    if (isValueRangeColorRule(rule)) {
      // custom ranges actually require no config (it is all handled through the
      // more specialized RangedValueRow components), so we just render the
      // necessary text here
      return TEXT.usingTheFollowingColors;
    }

    // render the config UI for quantile rules (a dropdown where the user can select
    // what type of quantiles they want)
    if (isQuantileColorRule(rule)) {
      const onQuantileChange = numNewQuantiles =>
        dispatch({
          numNewQuantiles,
          ruleToChange: rule,
          type: 'QUANTILE_RULES_REPLACE',
          ruleId,
        });

      return [
        TEXT.basedOn,
        <Dropdown
          key="quantile-rule-dropdown"
          ariaName={TEXT.quantiles}
          value={rule.ranges.size()}
          onSelectionChange={onQuantileChange}
        >
          {QUANTILE_OPTIONS}
        </Dropdown>,
        TEXT.usingTheFollowingColors,
      ];
    }

    // render the single value input box
    if (isSingleValueColorRule(rule)) {
      const onValueChange = v =>
        dispatch({
          ruleId,
          type: 'DATA_RULE_UPDATE',
          newColorRule: { ...rule, value: v === '' ? undefined : Number(v) },
        });

      return [
        <InputText.Uncontrolled
          key="single-value-input"
          debounce
          ariaName={TEXT.enterAValue}
          initialValue={String(rule.value === undefined ? '' : rule.value)}
          placeholder={TEXT.enterAValue}
          type="number"
          onChange={onValueChange}
        />,
        TEXT.dataPointsUsingTheFollowingColor,
      ];
    }

    if (isSimpleColorRule(rule)) {
      // no special config, so only the text here
      return TEXT.dataPointsUsingTheFollowingColor;
    }

    throw new Error(`Impossible rule type passed: ${rule.tag}`);
  }

  return (
    <Group.Horizontal
      flex
      alignItems="center"
      itemStyle={{ whiteSpace: 'nowrap' }}
      style={{ flexWrap: 'wrap' }}
    >
      {TEXT.iWantToColor}
      <Dropdown
        value={rule ? rule.tag : undefined}
        ariaName={TEXT.chooseOption}
        onSelectionChange={onChangeRuleType}
        defaultDisplayContent={TEXT.chooseOption}
      >
        {COLOR_RULE_OPTIONS}
      </Dropdown>
      {renderRuleSpecificConfig()}
    </Group.Horizontal>
  );
}
