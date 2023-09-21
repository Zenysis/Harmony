// @flow
import * as React from 'react';

import DataActionRulesDispatch from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Tooltip from 'components/ui/Tooltip';
import { scrollFinalDataActionIntoView } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/util/scrollFinalDataActionIntoView';

type Props = {
  fieldId: string,
  hasRulesToAdd: boolean,
  onAddRule: () => void,
};

function AddRuleButton({
  fieldId,
  hasRulesToAdd,
  onAddRule,
}: Props): React.Node {
  const dispatch = React.useContext(DataActionRulesDispatch);

  const addNewRule = () => {
    dispatch({ series: [fieldId], type: 'COLOR_RULE_ADD' });
    scrollFinalDataActionIntoView();
  };

  const onAddRuleClick = hasRulesToAdd ? onAddRule : addNewRule;

  const toolTipContent = I18N.text(
    'Add one or more color rules for each series',
  );

  return (
    <Tooltip content={toolTipContent} tooltipPlacement="top">
      <Icon
        ariaName={toolTipContent}
        className="data-action-rules-dropdown__add-color-icon"
        onClick={onAddRuleClick}
        type="plus-sign"
      />
    </Tooltip>
  );
}

export default (React.memo(AddRuleButton): React.AbstractComponent<Props>);
