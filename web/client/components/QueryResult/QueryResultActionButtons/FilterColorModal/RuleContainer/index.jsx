// @flow
import * as React from 'react';

import ActionOptionDropdown from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/RuleContainer/ActionOptionDropdown';
import ActionValueInput from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/RuleContainer/ActionValueInput';
import ColorRangeContainer from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/RuleContainer/ColorRangeContainer';
import Well from 'components/ui/Well';
import autobind from 'decorators/autobind';
import calculateUsedOptions from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/calculateUsedOptions';
import { PRESET_COLOR_ORDER } from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/constants';
import type {
  ActionOption,
  FieldFilterSelections,
  FilterRule,
} from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/types';

type Props = {
  fieldFilterSelections: FieldFilterSelections,
  fieldValues: $ReadOnlyArray<number>,
  ruleIdx: number,
  onFieldFilterSelectionsChange: (
    newFieldSelections: FieldFilterSelections,
  ) => void,

  rule?: FilterRule,
};

const TEXT = t('query_form.filters');

const NO_ACTION_TYPE = TEXT.choose_option;
const COLOR_ACTION = TEXT.color;
const REMOVE_ACTION = TEXT.remove;
const ACTION_TYPES = [NO_ACTION_TYPE, COLOR_ACTION, REMOVE_ACTION];

// TODO(pablo): action types are being identified uniquely by their
// label which is not good :(
// fixing this would involve changing things in our dashboard spec because a
// lot of dashboards have already persisted things using the filter action
// labels instead of the ids
const ACTION_TYPE_OPTIONS = ACTION_TYPES.map(actionTypeLabel => (
  <option value={actionTypeLabel} key={actionTypeLabel}>
    {actionTypeLabel}
  </option>
));

export default class RuleContainer extends React.PureComponent<Props> {
  static defaultProps = {
    rule: undefined,
  };

  isFirstRule() {
    return this.props.ruleIdx === 0;
  }

  // when the user changes the rule action (e.g. 'color', 'remove')
  @autobind
  onActionTypeChange(event: SyntheticEvent<HTMLSelectElement>) {
    const { ruleIdx, fieldFilterSelections } = this.props;
    const action = event.currentTarget.value;

    // update the rule
    const newRule = {
      action,
      actionColor:
        action === TEXT.color ? PRESET_COLOR_ORDER[ruleIdx] : undefined,
    };

    // update the field selections
    const newFieldSelections = {
      ...fieldFilterSelections,
      [ruleIdx]: newRule,
    };
    newFieldSelections.usedOptions = calculateUsedOptions(newFieldSelections);

    this.props.onFieldFilterSelectionsChange(newFieldSelections);
  }

  // This is called when the user changes the action option (e.g.
  // 'remove_above', 'color_below', etc.)
  @autobind
  onActionOptionChange(event: SyntheticEvent<HTMLSelectElement>) {
    const { ruleIdx, rule, fieldFilterSelections } = this.props;
    const actionOption: ActionOption = (event.currentTarget.value: any);

    // update the rule
    const newRule = {
      ...rule,
      actionOption,
    };

    // if we selected a range option, build the additional info we need for it
    let rangeInfo = {};
    if (actionOption === 'preset_ranges' || actionOption === 'custom_ranges') {
      rangeInfo = {
        numRangeColorInputs: 1,
        fieldsMinRange: [''],
        fieldsMaxRange: [''],
        fieldRangeColor: [PRESET_COLOR_ORDER[0]],
        rangeLabel: [''],
      };
    }

    // update fieldFilterSelections
    const newFieldSelections = {
      ...fieldFilterSelections,
      ...rangeInfo,
      [ruleIdx]: newRule,
    };
    newFieldSelections.usedOptions = calculateUsedOptions(newFieldSelections);

    this.props.onFieldFilterSelectionsChange(newFieldSelections);
  }

  maybeRenderActionOptionDropdown() {
    const { fieldFilterSelections, rule } = this.props;
    if (rule && rule.action !== NO_ACTION_TYPE) {
      return (
        <ActionOptionDropdown
          fieldFilterSelections={fieldFilterSelections}
          rule={rule}
          actionType={rule.action === COLOR_ACTION ? 'color' : 'remove'}
          onActionOptionChange={this.onActionOptionChange}
        />
      );
    }
    return null;
  }

  maybeRenderActionValueInput() {
    const { rule, ruleIdx, fieldValues, fieldFilterSelections } = this.props;
    if (rule && rule.actionOption) {
      return (
        <ActionValueInput
          actionType={rule.action === COLOR_ACTION ? 'color' : 'remove'}
          actionOption={rule.actionOption}
          ruleIdx={ruleIdx}
          rule={rule}
          fieldFilterSelections={fieldFilterSelections}
          fieldValues={fieldValues}
          onFieldFilterSelectionsChange={
            this.props.onFieldFilterSelectionsChange
          }
        />
      );
      // return this.getAction(selectedFieldId, ruleIdx);
    }
    return null;
  }

  maybeRenderColorRangeInputs() {
    const {
      rule,
      fieldFilterSelections,
      onFieldFilterSelectionsChange,
    } = this.props;
    if (
      rule &&
      (rule.actionOption === 'preset_ranges' ||
        rule.actionOption === 'custom_ranges')
    ) {
      return (
        <ColorRangeContainer
          rangeType={rule.actionOption}
          fieldFilterSelections={fieldFilterSelections}
          onFieldFilterSelectionsChange={onFieldFilterSelectionsChange}
        />
      );
    }
    return null;
  }

  renderRuleTitle() {
    return (
      <div className="modal-input-header">
        {this.isFirstRule()
          ? t('query_form.filters.rule_title_initial')
          : t('query_form.filters.rule_title')}
      </div>
    );
  }

  renderActionTypeDropdown() {
    const { rule } = this.props;

    // TODO(pablo): change this to use our actual Dropdown component
    return (
      <div className="col-xs-3 rule-dropdown">
        <select
          className="form-control input-sm"
          value={rule ? rule.action : NO_ACTION_TYPE}
          onChange={this.onActionTypeChange}
        >
          {ACTION_TYPE_OPTIONS}
        </select>
      </div>
    );
  }

  renderColorOrRemoveRules() {
    return (
      <span>
        <div className="col-xs-3">{this.maybeRenderActionOptionDropdown()}</div>
        <div className="col-xs-6">{this.maybeRenderActionValueInput()}</div>
        <div className="col-xs-12">{this.maybeRenderColorRangeInputs()}</div>
      </span>
    );
  }

  renderRuleForm() {
    return (
      <div className="row form-group">
        {this.renderActionTypeDropdown()}
        {this.renderColorOrRemoveRules()}
      </div>
    );
  }

  render() {
    return (
      <Well>
        {this.renderRuleTitle()}
        {this.renderRuleForm()}
      </Well>
    );
  }
}
