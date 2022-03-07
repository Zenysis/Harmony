// @flow
import * as React from 'react';

import ColorValueRulesBlock from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/ColorValueRulesBlock';
import DataActionRulesDispatch from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import Group from 'components/ui/Group';
import Icon from 'components/ui/Icon';
import InputText from 'components/ui/InputText';
import type { ValueRange } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';

type Props = {
  range: ValueRange,
  rangeIdx: number,
  ruleId: string,
  showDeleteIcon: boolean,
};

const TEXT = t(
  'visualizations.common.SettingsModal.SeriesSettingsTab.ColorRulesContainer.ValueRangeRow',
);

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
    dispatch({ ruleId, rangeIdx, type: 'VALUE_RANGE_REMOVE' });
  const onAddRange = () => dispatch({ ruleId, type: 'VALUE_RANGE_ADD' });
  const onChangeRange = newRange => {
    return dispatch({
      newRange,
      ruleId,
      rangeIdx,
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
    <Group.Horizontal flex alignItems="center" itemFlexValue={1}>
      <InputText.Uncontrolled
        debounce
        ariaName={TEXT.rangeLabel}
        initialValue={range.label}
        placeholder={TEXT.rangeLabel}
        onChange={onLabelChange}
      />
      <Group.Horizontal flex itemFlexValue={1}>
        <InputText.Uncontrolled
          debounce
          ariaName={TEXT.min}
          initialValue={String(range.min === undefined ? '' : range.min)}
          placeholder={TEXT.min}
          onChange={onMinChange}
          type="number"
        />
        <InputText.Uncontrolled
          debounce
          initialValue={String(range.max === undefined ? '' : range.max)}
          ariaName={TEXT.max}
          placeholder={TEXT.max}
          onChange={onMaxChange}
          type="number"
        />
      </Group.Horizontal>
      <Group.Horizontal flex alignItems="center">
        <ColorValueRulesBlock
          color={range.color}
          transformedText={range.transformedText}
          onTextValueChange={onTextValueChange}
          onColorChange={onColorChange}
        />
        <Icon ariaName={TEXT.addNewRange} type="plus" onClick={onAddRange} />
        {showDeleteIcon && (
          <Icon
            ariaName={TEXT.removeRange}
            type="remove"
            onClick={onRemoveRange}
          />
        )}
      </Group.Horizontal>
    </Group.Horizontal>
  );
}
