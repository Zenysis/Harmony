// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import FilterRulesDispatch from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal/FilterRulesDispatch';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import InputText from 'components/ui/InputText';
import Tooltip from 'components/ui/Tooltip';
import Well from 'components/ui/Well';
import { isSingleValueFilterRule } from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal/types';
import type {
  FieldFilterRuleTemplate,
  FilterRuleType,
} from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal/types';

type Props = {
  filter: FieldFilterRuleTemplate,
  ruleIdx: number,
  seriesInfo: $ReadOnlyArray<{ fieldId: string, seriesLabel: string }>,
};

const FILTER_RULES_ORDER_LABEL: $ReadOnlyArray<{
  key: FilterRuleType,
  label: string,
}> = [
  { key: 'TOP', label: I18N.textById('top') },
  { key: 'BOTTOM', label: I18N.textById('bottom') },
  { key: 'ABOVE_VALUE', label: I18N.textById('values above') },
  { key: 'EQUAL_TO_VALUE', label: I18N.textById('values equal to') },
  { key: 'BELOW_VALUE', label: I18N.textById('values below') },
  { key: 'ABOVE_AVERAGE', label: I18N.textById('above average') },
  { key: 'BELOW_AVERAGE', label: I18N.textById('below average') },
  { key: 'EQUAL_TO_NULL', label: I18N.textById('equal to null') },
  { key: 'NOT_A_NUMBER', label: I18N.textById('not a number') },
  { key: 'EQUAL_TO_ZERO', label: I18N.text('equal to zero') },
];

const FILTER_RULE_OPTIONS = FILTER_RULES_ORDER_LABEL.map(({ key, label }) => (
  <Dropdown.Option key={key} value={key}>
    {label}
  </Dropdown.Option>
));

export default function FilterRuleRow({
  filter,
  ruleIdx,
  seriesInfo,
}: Props): React.Node {
  const dispatch = React.useContext(FilterRulesDispatch);
  const onFieldChange = fieldId =>
    dispatch({ fieldId, ruleIdx, type: 'FIELD_CHANGE' });
  const onDeleteClick = () => dispatch({ ruleIdx, type: 'FILTER_RULE_DELETE' });
  const onRuleTypeChange = ruleType =>
    dispatch({
      ruleIdx,
      newRuleType: ruleType,
      oldRule: filter.rule,
      type: 'FILTER_RULE_TYPE_CHANGE',
    });

  const fieldOptions = React.useMemo(
    () =>
      seriesInfo.map(({ fieldId, seriesLabel }) => (
        <Dropdown.Option key={fieldId} value={fieldId}>
          {seriesLabel}
        </Dropdown.Option>
      )),
    [seriesInfo],
  );

  function maybeRenderRuleConfig() {
    const { rule } = filter;
    if (rule && isSingleValueFilterRule(rule)) {
      const onValueChange = val =>
        dispatch({
          ruleIdx,
          newFilterRule: {
            ...rule,
            value: val === '' ? undefined : Number(val),
          },
          type: 'FILTER_RULE_UPDATE',
        });
      const value = rule.value !== undefined ? String(rule.value) : '';
      return (
        <InputText
          ariaName={I18N.text('value')}
          onChange={onValueChange}
          type="number"
          value={value}
          width={100}
        />
      );
    }
    return null;
  }

  return (
    <Group.Horizontal
      alignItems="center"
      firstItemFlexValue={1}
      flex
      spacing="m"
      testId="filter-rule-row"
    >
      <Well>
        <Group.Horizontal>
          <I18N id="forTheFollowingIndicator">For the following indicator</I18N>
          <Dropdown
            ariaName={I18N.text('select an indicator', 'selectAnIndicator')}
            defaultDisplayContent={I18N.textById('selectAnIndicator')}
            onSelectionChange={onFieldChange}
            value={filter.fieldId}
          >
            {fieldOptions}
          </Dropdown>
          <I18N id="iWantToRemove">I want to remove</I18N>
          <Dropdown
            ariaName={I18N.text('choose option')}
            defaultDisplayContent={I18N.textById('choose option')}
            onSelectionChange={onRuleTypeChange}
            value={filter.rule ? filter.rule.tag : undefined}
          >
            {FILTER_RULE_OPTIONS}
          </Dropdown>
          {maybeRenderRuleConfig()}
          <I18N>data points</I18N>
        </Group.Horizontal>
      </Well>
      <Tooltip
        content={I18N.text('Delete filter rule', 'removeFilterRuleTooltip')}
        tooltipPlacement="right"
      >
        <Icon
          className="query-result-filter-modal__delete-icon"
          onClick={onDeleteClick}
          type="trash"
        />
      </Tooltip>
    </Group.Horizontal>
  );
}
