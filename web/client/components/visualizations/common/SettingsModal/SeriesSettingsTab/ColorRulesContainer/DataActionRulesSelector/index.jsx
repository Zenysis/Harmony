// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import AddRuleButton from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesSelector/AddRuleButton';
import DataActionRule from 'models/core/QueryResultSpec/DataActionRule';
import DataActionRulesDropdown from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesSelector/DataActionRulesDropdown';

type Props = {
  dataActionRules: Zen.Array<DataActionRule>,
  fieldId: string,
  onDataActionsChange: (dataActions: Zen.Array<DataActionRule>) => void,
};

function DataActionRulesSelector({
  dataActionRules,
  fieldId,
  onDataActionsChange,
}: Props): React.Node {
  const selectedActionRuleIds = React.useMemo(() => {
    return dataActionRules
      .arrayView()
      .filter(rule => rule.series().has(fieldId))
      .map(rule => rule.id());
  }, [dataActionRules, fieldId]);

  const [showDropdown, setShowDropdown] = React.useState<boolean>(false);
  const [openDropdownMenu, setOpenDropdownMenu] = React.useState<boolean>(
    false,
  );

  const dataActionRulesDropdownRef = React.useRef();

  React.useEffect(() => {
    setShowDropdown(selectedActionRuleIds.length !== 0);
  }, [selectedActionRuleIds]);

  React.useEffect(() => {
    if (openDropdownMenu) {
      const elt = dataActionRulesDropdownRef.current;
      if (elt) {
        const dropdown = elt.children[0];
        const dropdownBtn = dropdown.children[0];
        const btn = dropdownBtn.children[0];
        btn.click();
        setOpenDropdownMenu(false);
      }
    }
  }, [openDropdownMenu]);

  const onSelectionChange = (newSelectedRuleIds: $ReadOnlyArray<string>) => {
    const selectedRules = dataActionRules.filter(rule =>
      newSelectedRuleIds.includes(rule.id()),
    );

    const newDataActionRules = dataActionRules.map(rule => {
      if (selectedRules.includes(rule)) {
        return rule.series(rule.series().add(fieldId));
      }
      const newSeries = rule.series();
      newSeries.delete(fieldId);
      return rule.series(newSeries);
    });
    onDataActionsChange(newDataActionRules);
  };

  const onAddRule = () => {
    setShowDropdown(!showDropdown);
    setOpenDropdownMenu(true);
  };

  const onCloseDropdown = () => {
    setShowDropdown(false);
  };

  return showDropdown ? (
    <DataActionRulesDropdown
      ref={dataActionRulesDropdownRef}
      dataActionRules={dataActionRules}
      fieldId={fieldId}
      onCloseDropdown={onCloseDropdown}
      onSelectionChange={onSelectionChange}
      selectedActionRuleIds={selectedActionRuleIds}
    />
  ) : (
    <AddRuleButton
      onAddRule={onAddRule}
      fieldId={fieldId}
      hasRulesToAdd={dataActionRules.size() !== 0}
    />
  );
}

export default (React.memo(
  DataActionRulesSelector,
): React.AbstractComponent<Props>);
