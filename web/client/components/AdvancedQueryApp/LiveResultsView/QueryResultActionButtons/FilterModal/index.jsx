// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Button from 'components/ui/Button';
import FilterRuleRow from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal/FilterRuleRow';
import FilterRulesDispatch, {
  filterRulesReducer,
  initializeRuleTemplates,
} from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal/FilterRulesDispatch';
import Group from 'components/ui/Group';
import usePrevious from 'lib/hooks/usePrevious';
import {
  countIncompleteRules,
  filterRuleTemplatesToDataFilterGroup,
} from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal/util';
import type QueryResultSpec from 'models/core/QueryResultSpec';

const TEXT_PATH = 'query_result.FilterModal';
const TEXT = t(TEXT_PATH);

type Props = {
  onQueryResultSpecChange: QueryResultSpec => void,
  onRequestClose: () => void,
  queryResultSpec: QueryResultSpec,
  seriesInfo: $ReadOnlyArray<{ fieldId: string, seriesLabel: string }>,
  show: boolean,
};

export default function FilterModal({
  onQueryResultSpecChange,
  onRequestClose,
  queryResultSpec,
  seriesInfo,
  show,
}: Props): React.Node {
  const [filterRules, dispatch] = React.useReducer(
    filterRulesReducer,
    queryResultSpec,
    initializeRuleTemplates,
  );
  const prevShow = usePrevious(show);
  const onAddRuleClick = () => dispatch({ type: 'FILTER_RULE_ADD' });

  // when the modal is opened, we should reset the filterRules according
  // to the current queryResultSpec
  React.useEffect(() => {
    if (show && show !== prevShow) {
      dispatch({ queryResultSpec, type: 'FILTER_RULES_RESET' });
    }
  }, [show, prevShow, queryResultSpec]);

  const onSubmit = React.useCallback(() => {
    const dataFilters = filterRuleTemplatesToDataFilterGroup(filterRules);
    onQueryResultSpecChange(queryResultSpec.dataFilters(dataFilters));
    onRequestClose();
  }, [queryResultSpec, onQueryResultSpecChange, onRequestClose, filterRules]);

  const filterRows = filterRules.mapValues((filter, i) => (
    <FilterRuleRow
      key={filter.id}
      filter={filter}
      ruleIdx={i}
      seriesInfo={seriesInfo}
    />
  ));

  const numIncompleteRules = countIncompleteRules(filterRules);
  const rulesAreIncomplete = numIncompleteRules > 0;
  const modalButtonTooltipText = rulesAreIncomplete
    ? t('rulesAreIncomplete', { scope: TEXT_PATH, count: numIncompleteRules })
    : '';

  return (
    <BaseModal
      height="70%"
      className="query-result-filter-modal"
      maxHeight={850}
      show={show}
      onRequestClose={onRequestClose}
      title={TEXT.title}
      titleTooltip={TEXT.titleTooltip}
      width="auto"
      minWidth="50%"
      onPrimaryAction={onSubmit}
      primaryButtonText={TEXT.applyRules}
      primaryButtonTooltip={modalButtonTooltipText}
      disablePrimaryButton={rulesAreIncomplete}
    >
      <FilterRulesDispatch.Provider value={dispatch}>
        <Group.Vertical
          flex
          alignItems="center"
          itemStyle={{ width: '100%' }}
          lastItemStyle={{ width: 'auto' }}
          spacing="m"
        >
          {filterRules.isEmpty() ? <p>{TEXT.noFiltersAdded}</p> : filterRows}
          <Button ariaName={TEXT.addFilterRule} onClick={onAddRuleClick}>
            + {TEXT.addFilterRule}
          </Button>
        </Group.Vertical>
      </FilterRulesDispatch.Provider>
    </BaseModal>
  );
}
