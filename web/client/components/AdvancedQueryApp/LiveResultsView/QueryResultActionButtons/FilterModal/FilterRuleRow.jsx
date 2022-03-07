// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import FilterRulesDispatch from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal/FilterRulesDispatch';
import Group from 'components/ui/Group';
import Icon from 'components/ui/Icon';
import InputText from 'components/ui/InputText';
import Tooltip from 'components/ui/Tooltip';
import Well from 'components/ui/Well';
import { isSingleValueFilterRule } from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal/types';
import type {
  FieldFilterRuleTemplate,
  FilterRuleType,
} from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal/types';

const TEXT = t('query_result.FilterModal.FilterRuleRow');

type Props = {
  filter: FieldFilterRuleTemplate,
  ruleIdx: number,
  seriesInfo: $ReadOnlyArray<{ fieldId: string, seriesLabel: string }>,
};

const FILTER_RULES_ORDER: $ReadOnlyArray<FilterRuleType> = [
  'TOP',
  'BOTTOM',
  'ABOVE_VALUE',
  'BELOW_VALUE',
  'ABOVE_AVERAGE',
  'BELOW_AVERAGE',
  'EQUAL_TO_NULL',
  'EQUAL_TO_ZERO',
];

const FILTER_RULE_OPTIONS = FILTER_RULES_ORDER.map(ruleKey => (
  <Dropdown.Option key={ruleKey} value={ruleKey}>
    {TEXT[ruleKey]}
  </Dropdown.Option>
));

export default function FilterRuleRow({
  filter,
  ruleIdx,
  seriesInfo,
}: Props): React.Node {
  const dispatch = React.useContext(FilterRulesDispatch);
  const onFieldChange = fieldId =>
    dispatch({ ruleIdx, fieldId, type: 'FIELD_CHANGE' });
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
          type: 'FILTER_RULE_UPDATE',
          newFilterRule: {
            ...rule,
            value: val === '' ? undefined : Number(val),
          },
        });
      const value = rule.value !== undefined ? String(rule.value) : '';
      return (
        <InputText
          ariaName={TEXT.value}
          value={value}
          onChange={onValueChange}
          type="number"
          width={100}
        />
      );
    }
    return null;
  }

  return (
    <Group.Horizontal
      spacing="m"
      flex
      firstItemFlexValue={1}
      alignItems="center"
      testId="filter-rule-row"
    >
      <Well>
        <Group.Horizontal>
          {TEXT.forTheFollowingIndicator}
          <Dropdown
            value={filter.fieldId}
            ariaName={TEXT.selectAnIndicator}
            defaultDisplayContent={TEXT.selectAnIndicator}
            onSelectionChange={onFieldChange}
          >
            {fieldOptions}
          </Dropdown>
          {TEXT.iWantToRemove}
          <Dropdown
            value={filter.rule ? filter.rule.tag : undefined}
            ariaName={TEXT.chooseOption}
            defaultDisplayContent={TEXT.chooseOption}
            onSelectionChange={onRuleTypeChange}
          >
            {FILTER_RULE_OPTIONS}
          </Dropdown>
          {maybeRenderRuleConfig()}
          {TEXT.dataPoints}
        </Group.Horizontal>
      </Well>
      <Tooltip content={TEXT.removeFilterRuleTooltip} tooltipPlacement="right">
        <Icon
          className="query-result-filter-modal__delete-icon"
          type="trash"
          onClick={onDeleteClick}
        />
      </Tooltip>
    </Group.Horizontal>
  );
}
