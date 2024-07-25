// @flow
import * as React from 'react';

import ColorLabelRow from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/ColorLabelRow';
import ColorRuleConfig from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/ColorRuleConfig';
import DataActionRulesDispatch from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import QuantileRangeRow from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/QuantileRangeRow';
import Tooltip from 'components/ui/Tooltip';
import ValueRangeRow from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/ValueRangeRow';
import { isRangedColorRule } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';
import type { ColorRuleTemplate } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';

type Props = {
  rule: ColorRuleTemplate | void,
  ruleId: string,
};

/**
 * This component renders a color rule. It takes in an *array* of
 * color actions because ranged rules are represented by multiple actions
 * (e.g. color 1st quartile, color 2nd quartile, etc.). So semantically we
 * may refer to them as a single rule ("color quartiles"), but under the hood
 * they are represented as multiple rules.
 *
 */
export default function ColorRuleRow({ rule, ruleId }: Props): React.Node {
  const dispatch = React.useContext(DataActionRulesDispatch);
  const onDeleteClick = () => dispatch({ ruleId, type: 'COLOR_RULE_DELETE' });

  function maybeRenderValueRangesContainer() {
    if (rule) {
      // if we're selecting ranged rules like quartiles or custom ranges,
      // create a list of rules
      if (isRangedColorRule(rule)) {
        const rangeRows = rule.ranges.mapValues((range, i) => {
          if (range.type === 'quantile') {
            const { n, percentile } = range;
            return (
              <QuantileRangeRow
                key={`quantile_${ruleId}_${percentile}_${n}`}
                range={range}
                rangeIdx={i}
                ruleId={ruleId}
              />
            );
          }
          if (range.type === 'value') {
            return (
              <ValueRangeRow
                key={`value_range_${range.id}`}
                range={range}
                rangeIdx={i}
                ruleId={ruleId}
                showDeleteIcon={rule.ranges.size() > 1}
              />
            );
          }
          throw new Error(`Invalid range type: ${range.type}`);
        });
        return <Group.Vertical>{rangeRows}</Group.Vertical>;
      }

      // render the color and label for single value or simple color rules
      return <ColorLabelRow rule={rule} ruleId={ruleId} />;
    }
    return null;
  }

  return (
    <Group.Horizontal
      alignItems="center"
      firstItemFlexValue={1}
      flex
      spacing="none"
    >
      <Group.Vertical>
        <ColorRuleConfig rule={rule} ruleId={ruleId} />
        {maybeRenderValueRangesContainer()}
      </Group.Vertical>
      <Tooltip
        content={I18N.text('Delete color rule')}
        tooltipPlacement="right"
      >
        <Icon
          ariaName={I18N.textById('Delete color rule')}
          className="series-settings-color-rule-row__delete-icon"
          onClick={onDeleteClick}
          type="trash"
        />
      </Tooltip>
    </Group.Horizontal>
  );
}
