// @flow

import * as React from 'react';

import * as Zen from 'lib/Zen';
import Button from 'components/ui/Button';
import ColorRulesContainer from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer';
import DataActionRulesDispatch from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import { scrollFinalDataActionIntoView } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/util/scrollFinalDataActionIntoView';
import type { ColorRuleTemplateHolder } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';

type Props = {
  ruleTemplates: Zen.Array<ColorRuleTemplateHolder>,
};

function DataActionsContainer({ ruleTemplates }: Props): React.Node {
  const dispatch = React.useContext(DataActionRulesDispatch);

  const onAddColorRuleClick = () => {
    dispatch({ type: 'COLOR_RULE_ADD', series: [] });
    scrollFinalDataActionIntoView();
  };

  return (
    <Group.Vertical marginTop="l">
      <Group.Horizontal alignItems="center" flex>
        <Heading size={Heading.Sizes.SMALL}>
          <I18N>Color Rules</I18N>
        </Heading>
        <Group.Item className="data-actions-container__create-btn">
          <Button onClick={onAddColorRuleClick} outline>
            <Icon type="pencil" /> <I18N>Create rule</I18N>
          </Button>
        </Group.Item>
      </Group.Horizontal>
      <div className="data-actions-container__divider" />
      {ruleTemplates.size() > 0 && (
        <>
          <ColorRulesContainer colorRules={ruleTemplates} />
          <div
            id="data-actions-container-bottom-divider"
            className="data-actions-container__divider"
          />
        </>
      )}
    </Group.Vertical>
  );
}

export default (React.memo(
  DataActionsContainer,
): React.AbstractComponent<Props>);
