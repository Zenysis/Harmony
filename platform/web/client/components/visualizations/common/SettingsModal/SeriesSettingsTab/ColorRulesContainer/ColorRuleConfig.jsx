// @flow
import * as React from 'react';

import DataActionRulesDispatch from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
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

const QUANTILES = {
  '2': I18N.text('Medians (equal halves)', 'Medians'),
  '3': I18N.text('Tertiles (equal thirds)', 'Tertiles'),
  '4': I18N.text('Quartiles (equal fourths)', 'Quartiles'),
  '5': I18N.text('Quintiles (equal fifths)', 'Quintiles'),
  // eslint-disable-next-line
  '10': I18N.text('Deciles (equal tenths)', 'Deciles'),
};
const QUANTILE_OPTIONS = Object.keys(QUANTILES).map(q => (
  <Dropdown.Option key={q} value={parseInt(q, 10)}>
    {QUANTILES[q]}
  </Dropdown.Option>
));

const COLOR_RULES_ORDER_LABEL: $ReadOnlyArray<{
  key: ColorRuleType,
  label: string,
}> = [
  { key: 'TOP', label: I18N.text('top') },
  { key: 'BOTTOM', label: I18N.text('bottom') },
  { key: 'ABOVE_VALUE', label: I18N.text('values above') },
  { key: 'BELOW_VALUE', label: I18N.text('values below') },
  { key: 'ABOVE_AVERAGE', label: I18N.text('above average') },
  { key: 'BELOW_AVERAGE', label: I18N.text('below average') },
  { key: 'IN_QUANTILE', label: I18N.text('preset ranges') },
  { key: 'IN_VALUE_RANGE', label: I18N.text('custom ranges') },
  { key: 'IS_TRUE', label: I18N.text('True') },
  { key: 'IS_FALSE', label: I18N.text('False') },
  { key: 'EQUAL_TO_VALUE', label: I18N.text('values equal to') },
  { key: 'EQUAL_TO_NULL', label: I18N.text('equal to null') },
  { key: 'NOT_A_NUMBER', label: I18N.text('not a number') },
];

const COLOR_RULE_OPTIONS = COLOR_RULES_ORDER_LABEL.map(({ key, label }) => {
  return (
    <Dropdown.Option key={key} value={key}>
      {label}
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
      newRuleType: ruleType,
      oldRule: rule,
      type: 'COLOR_RULE_TYPE_CHANGE',
    });

  function renderRuleSpecificConfig() {
    if (rule === undefined) {
      return null;
    }

    if (isValueRangeColorRule(rule)) {
      // custom ranges actually require no config (it is all handled through the
      // more specialized RangedValueRow components), so we just render the
      // necessary text here
      return I18N.text(
        'using the following colors:',
        'usingTheFollowingColors',
      );
    }

    // render the config UI for quantile rules (a dropdown where the user can select
    // what type of quantiles they want)
    if (isQuantileColorRule(rule)) {
      const onQuantileChange = numNewQuantiles =>
        dispatch({
          numNewQuantiles,
          ruleId,
          ruleToChange: rule,
          type: 'QUANTILE_RULES_REPLACE',
        });

      return [
        <I18N key="based-on">based on</I18N>,
        <Dropdown
          key="quantile-rule-dropdown"
          ariaName={I18N.text('Quantiles')}
          onSelectionChange={onQuantileChange}
          value={rule.ranges.size()}
        >
          {QUANTILE_OPTIONS}
        </Dropdown>,
        I18N.textById('usingTheFollowingColors'),
      ];
    }

    // render the single value input box
    if (isSingleValueColorRule(rule)) {
      const onValueChange = v =>
        dispatch({
          ruleId,
          newColorRule: { ...rule, value: v === '' ? undefined : Number(v) },
          type: 'DATA_RULE_UPDATE',
        });

      return [
        <InputText.Uncontrolled
          key="single-value-input"
          ariaName={I18N.text('enter a value')}
          debounce
          initialValue={String(rule.value === undefined ? '' : rule.value)}
          onChange={onValueChange}
          placeholder={I18N.textById('enter a value')}
          type="number"
        />,
        <I18N key={rule.label} id="dataPointsUsingTheFollowingColor">
          data points using the following color:
        </I18N>,
      ];
    }

    if (isSimpleColorRule(rule)) {
      // no special config, so only the text here
      return <I18N.Ref id="dataPointsUsingTheFollowingColor" />;
    }

    throw new Error(`Impossible rule type passed: ${rule.tag}`);
  }

  return (
    <Group.Horizontal
      alignItems="center"
      flex
      itemStyle={{ whiteSpace: 'nowrap' }}
      style={{ flexWrap: 'wrap' }}
    >
      <I18N id="iWantToColor">I want to color</I18N>
      <Dropdown
        ariaName={I18N.text('Choose option')}
        defaultDisplayContent={I18N.textById('Choose option')}
        onSelectionChange={onChangeRuleType}
        value={rule ? rule.tag : undefined}
      >
        {COLOR_RULE_OPTIONS}
      </Dropdown>
      {renderRuleSpecificConfig()}
    </Group.Horizontal>
  );
}
