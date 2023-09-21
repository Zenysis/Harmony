// @flow
import * as React from 'react';

import ColorValueRulesBlock from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/ColorValueRulesBlock';
import DataActionRulesDispatch from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import InputText from 'components/ui/InputText';
import type { ValueRange } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';

type Props = {
  range: ValueRange,
  rangeIdx: number,
  ruleId: string,
  showDeleteIcon: boolean,
};

/**
 * This component is only rendered for color rules that apply to ranges
 * (such as quantile rules or custom range rules).
 */
export default function ValueRangeRow({
  range,
  rangeIdx,
  ruleId,
  showDeleteIcon,
}: Props): React.Node {
  const dispatch = React.useContext(DataActionRulesDispatch);
  const onRemoveRange = () =>
    dispatch({ rangeIdx, ruleId, type: 'VALUE_RANGE_REMOVE' });
  const onAddRange = () => dispatch({ ruleId, type: 'VALUE_RANGE_ADD' });
  const onChangeRange = newRange => {
    return dispatch({
      newRange,
      rangeIdx,
      ruleId,
      type: 'VALUE_RANGE_CHANGE',
    });
  };

  const onMinChange = min =>
    onChangeRange({ ...range, min: min === '' ? undefined : Number(min) });
  const onMaxChange = max =>
    onChangeRange({ ...range, max: max === '' ? undefined : Number(max) });
  const onLabelChange = label => onChangeRange({ ...range, label });
  const onColorChange = color => onChangeRange({ ...range, color });
  const onTextValueChange = transformedText =>
    onChangeRange({ ...range, transformedText });
  return (
    <Group.Horizontal alignItems="center" flex itemFlexValue={1}>
      <InputText.Uncontrolled
        ariaName={I18N.textById('Range label')}
        debounce
        initialValue={range.label}
        onChange={onLabelChange}
        placeholder={I18N.textById('Range label')}
      />
      <Group.Horizontal flex itemFlexValue={1}>
        <InputText.Uncontrolled
          ariaName={I18N.textById('Min')}
          debounce
          initialValue={String(range.min === undefined ? '' : range.min)}
          onChange={onMinChange}
          placeholder={I18N.textById('Min')}
          type="number"
        />
        <InputText.Uncontrolled
          ariaName={I18N.textById('Max')}
          debounce
          initialValue={String(range.max === undefined ? '' : range.max)}
          onChange={onMaxChange}
          placeholder={I18N.textById('Max')}
          type="number"
        />
      </Group.Horizontal>
      <Group.Horizontal alignItems="center" flex>
        <ColorValueRulesBlock
          color={range.color}
          onColorChange={onColorChange}
          onTextValueChange={onTextValueChange}
          transformedText={range.transformedText}
        />
        <Icon
          ariaName={I18N.text('Add new range')}
          onClick={onAddRange}
          type="plus"
        />
        {showDeleteIcon && (
          <Icon
            ariaName={I18N.text('Remove range')}
            onClick={onRemoveRange}
            type="remove"
          />
        )}
      </Group.Horizontal>
    </Group.Horizontal>
  );
}
