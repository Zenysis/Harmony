// @flow
import * as React from 'react';

import ColorValueRulesBlock from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/ColorValueRulesBlock';
import DataActionRulesDispatch from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import type {
  SimpleColorRule,
  SingleValueColorRule,
} from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';

type Props = {
  rule: SimpleColorRule | SingleValueColorRule,
  ruleId: string,
};

export default function ColorLabelRow({ rule, ruleId }: Props): React.Node {
  const dispatch = React.useContext(DataActionRulesDispatch);
  const onColorChange = color =>
    dispatch({
      ruleId,
      newColorRule: { ...rule, color },
      type: 'DATA_RULE_UPDATE',
    });

  const onTextValueChange = transformedText =>
    dispatch({
      ruleId,
      newColorRule: { ...rule, transformedText },
      type: 'DATA_RULE_UPDATE',
    });

  const onLabelChange = label =>
    dispatch({
      ruleId,
      newColorRule: { ...rule, label },
      type: 'DATA_RULE_UPDATE',
    });

  return (
    <Group.Horizontal alignItems="center" flex itemFlexValue={1}>
      <InputText.Uncontrolled
        ariaName={I18N.text('Range label')}
        debounce
        initialValue={rule.label}
        onChange={onLabelChange}
        placeholder={I18N.textById('Range label')}
      />
      <ColorValueRulesBlock
        color={rule.color}
        onColorChange={onColorChange}
        onTextValueChange={onTextValueChange}
        transformedText={rule.transformedText}
      />
    </Group.Horizontal>
  );
}
