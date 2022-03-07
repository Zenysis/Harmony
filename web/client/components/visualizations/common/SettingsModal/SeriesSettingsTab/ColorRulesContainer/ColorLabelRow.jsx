// @flow
import * as React from 'react';

import ColorValueRulesBlock from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/ColorValueRulesBlock';
import DataActionRulesDispatch from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import Group from 'components/ui/Group';
import InputText from 'components/ui/InputText';
import type {
  SimpleColorRule,
  SingleValueColorRule,
} from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';

type Props = {
  rule: SimpleColorRule | SingleValueColorRule,
  ruleId: string,
};

const TEXT = t(
  'visualizations.common.SettingsModal.SeriesSettingsTab.ColorRulesContainer.ColorLabelRow',
);

export default function ColorLabelRow({ rule, ruleId }: Props): React.Node {
  const dispatch = React.useContext(DataActionRulesDispatch);
  const onColorChange = color =>
    dispatch({
      ruleId,
      type: 'DATA_RULE_UPDATE',
      newColorRule: { ...rule, color },
    });

  const onTextValueChange = transformedText =>
    dispatch({
      ruleId,
      type: 'DATA_RULE_UPDATE',
      newColorRule: { ...rule, transformedText },
    });

  const onLabelChange = label =>
    dispatch({
      ruleId,
      type: 'DATA_RULE_UPDATE',
      newColorRule: { ...rule, label },
    });

  return (
    <Group.Horizontal flex alignItems="center" itemFlexValue={1}>
      <InputText.Uncontrolled
        debounce
        ariaName={TEXT.rangeLabel}
        initialValue={rule.label}
        placeholder={TEXT.rangeLabel}
        onChange={onLabelChange}
      />
      <ColorValueRulesBlock
        color={rule.color}
        onColorChange={onColorChange}
        transformedText={rule.transformedText}
        onTextValueChange={onTextValueChange}
      />
    </Group.Horizontal>
  );
}
