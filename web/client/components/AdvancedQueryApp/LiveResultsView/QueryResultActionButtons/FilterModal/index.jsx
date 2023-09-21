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
import I18N from 'lib/I18N';
import usePrevious from 'lib/hooks/usePrevious';
import {
  countIncompleteRules,
  filterRuleTemplatesToDataFilterGroup,
} from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal/util';
import type QueryResultSpec from 'models/core/QueryResultSpec';

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
  const modalButtonTooltipText = numIncompleteRules
    ? I18N.text(
        {
          one: 'You have %(count)s incomplete rule',
          other: 'You have %(count)s incomplete rules',
          // NOTE: If there are no incomplete rules, then the empty string is used.
          zero: '',
        },
        'rulesAreIncomplete',
        { count: numIncompleteRules },
      )
    : '';

  return (
    <BaseModal
      className="query-result-filter-modal"
      disablePrimaryButton={rulesAreIncomplete}
      height="70%"
      maxHeight={850}
      minWidth="50%"
      onPrimaryAction={onSubmit}
      onRequestClose={onRequestClose}
      primaryButtonText={I18N.text('Apply rules')}
      primaryButtonTooltip={modalButtonTooltipText}
      show={show}
      title={I18N.text('Filter data')}
      titleTooltip={I18N.text(
        'Remove values from your query results',
        'filterModalTooltip',
      )}
      width="auto"
    >
      <FilterRulesDispatch.Provider value={dispatch}>
        <Group.Vertical
          alignItems="center"
          flex
          itemStyle={{ width: '100%' }}
          lastItemStyle={{ width: 'auto' }}
          spacing="m"
        >
          {filterRules.isEmpty() ? (
            <p>
              <I18N id="noFiltersAdded">
                You have not created any filter rules yet
              </I18N>
            </p>
          ) : (
            filterRows
          )}
          <Button
            ariaName={I18N.textById('addFilterRule')}
            onClick={onAddRuleClick}
          >
            + <I18N id="addFilterRule">Add filter rule</I18N>
          </Button>
        </Group.Vertical>
      </FilterRulesDispatch.Provider>
    </BaseModal>
  );
}
