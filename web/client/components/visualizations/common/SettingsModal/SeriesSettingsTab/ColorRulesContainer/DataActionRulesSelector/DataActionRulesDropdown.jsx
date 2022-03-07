// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import DataActionRule from 'models/core/QueryResultSpec/DataActionRule';
import DataActionRulesDispatch from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import { scrollFinalDataActionIntoView } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/util/scrollFinalDataActionIntoView';

const ADD_NEW_RULE_ID = 'add-new-rule';
type Props = {
  dataActionRules: Zen.Array<DataActionRule>,
  fieldId: string,
  onCloseDropdown: () => void,
  onSelectionChange: (newSelectedActionRuleIds: $ReadOnlyArray<string>) => void,
  selectedActionRuleIds: $ReadOnlyArray<string>,
};

const DataActionRulesDropdown = React.forwardRef(
  (
    {
      dataActionRules,
      fieldId,
      onCloseDropdown,
      onSelectionChange,
      selectedActionRuleIds,
    }: Props,
    ref: $Ref<React.ElementRef<'div'>>,
  ) => {
    const dispatch = React.useContext(DataActionRulesDispatch);
    const dataActionOptions = dataActionRules
      .map((rule, idx) => (
        <Dropdown.Option key={rule.id()} value={rule.id()}>
          <I18N idx={idx + 1}>Rule %(idx)s</I18N>
        </Dropdown.Option>
      ))
      .arrayView();

    const onDropdownSelectionShange = newSelectedRuleIds => {
      if (newSelectedRuleIds.includes(ADD_NEW_RULE_ID)) {
        onCloseDropdown();
        dispatch({ type: 'COLOR_RULE_ADD', series: [fieldId] });
        scrollFinalDataActionIntoView();
        return;
      }

      onSelectionChange(newSelectedRuleIds);
    };

    return (
      <div ref={ref}>
        <Dropdown.Multiselect
          buttonMinWidth={80}
          value={selectedActionRuleIds}
          onSelectionChange={onDropdownSelectionShange}
          defaultDisplayContent={I18N.text('Select a rule to apply')}
        >
          <Dropdown.Option key="add-new-rule" value={ADD_NEW_RULE_ID}>
            <I18N>Create a new color rule</I18N>
          </Dropdown.Option>
          {dataActionOptions}
        </Dropdown.Multiselect>
      </div>
    );
  },
);

export default (React.memo(DataActionRulesDropdown): React.AbstractComponent<
  Props,
  React.ElementRef<'div'>,
>);
