// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import ColorRuleRow from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/ColorRuleRow';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Well from 'components/ui/Well';
import type { ColorRuleTemplateHolder } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';

type Props = {
  colorRules: Zen.Array<ColorRuleTemplateHolder>,
};

export default function ColorRulesContainer({ colorRules }: Props): React.Node {
  const colorRows = colorRules.mapValues((ruleHolder, i) => (
    <Group.Item
      key={ruleHolder.id}
      paddingBottom={i === colorRules.size() - 1 ? 'none' : 's'}
      testId="color-rule-row"
    >
      <Heading
        className="series-settings-color-rule-row__title"
        size={Heading.Sizes.SMALL}
      >
        <I18N ruleIdx={i + 1}>Rule %(ruleIdx)s </I18N>
      </Heading>
      <Well>
        <ColorRuleRow rule={ruleHolder.rule} ruleId={ruleHolder.id} />
      </Well>
    </Group.Item>
  ));

  return (
    <Group.Vertical itemClassName="series-settings-color-rule-row">
      {colorRows}
    </Group.Vertical>
  );
}
