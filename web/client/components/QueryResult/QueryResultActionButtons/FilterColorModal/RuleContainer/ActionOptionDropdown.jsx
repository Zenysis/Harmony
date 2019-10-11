// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import {
  COLOR_ACTIONS,
  EXCLUSIVE_OPTIONS,
  REMOVE_ACTIONS,
} from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/constants';
import type {
  ActionOption,
  FieldFilterSelections,
  FilterRule,
} from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/types';

type Props = {
  actionType: 'color' | 'remove',
  fieldFilterSelections: FieldFilterSelections,
  onActionOptionChange: (SyntheticEvent<HTMLSelectElement>) => void,
  rule: FilterRule,
};

export default class ActionOptionDropdown extends React.PureComponent<Props> {
  isOptionDisabled(actionOption: ActionOption) {
    const { fieldFilterSelections, rule } = this.props;
    if (fieldFilterSelections.usedOptions) {
      const { usedOptions } = fieldFilterSelections;
      let disableOption = usedOptions.includes(actionOption);

      // if this rule's actionOption has alternatives in EXCLUSIVE_OPTIONS,
      // we still want to enable them so that the user can be allowed to
      // change to it
      if (rule.actionOption) {
        const excludedOptions = EXCLUSIVE_OPTIONS[rule.actionOption];
        if (excludedOptions && excludedOptions.includes(actionOption)) {
          disableOption = false;
        }
      }
      return disableOption;
    }
    return false;
  }

  renderActionOptions(): Array<React.Element<'option'>> {
    const { actionType } = this.props;
    const actionOptionsTextMap =
      actionType === 'color' ? COLOR_ACTIONS : REMOVE_ACTIONS;

    return Object.entries(actionOptionsTextMap).map(
      ([actionOption, actionOptionLabel]) => (
        <option
          value={actionOption}
          key={actionOption}
          disabled={this.isOptionDisabled(Zen.cast<ActionOption>(actionOption))}
        >
          {Zen.cast<string>(actionOptionLabel)}
        </option>
      ),
    );
  }

  render() {
    const { rule, onActionOptionChange } = this.props;

    // TODO(pablo): use actual dropdown component
    return (
      <select
        className="form-control input-sm"
        value={rule.actionOption}
        onChange={onActionOptionChange}
      >
        {this.renderActionOptions()}
      </select>
    );
  }
}
