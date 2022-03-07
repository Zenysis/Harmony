// @flow
import * as React from 'react';
import numeral from 'numeral';

import ColorValueRulesBlock from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/ColorValueRulesBlock';
import DataActionRulesDispatch from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import Group from 'components/ui/Group';
import InputText from 'components/ui/InputText';
import type { QuantileRange } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';

type Props = {
  range: QuantileRange,
  rangeIdx: number,
  ruleId: string,
};

const TEXT_PATH =
  'visualizations.common.SettingsModal.SeriesSettingsTab.ColorRulesContainer.QuantileRangeRow';
const TEXT = t(TEXT_PATH);

// format a number to two decimal places only if necessary
function _twoDecimalPlaces(num: number): string {
  return numeral(num).format('0,0.[00]');
}

function _quantileToString(range: QuantileRange) {
  const { percentile, n } = range;
  const startPercent = `${_twoDecimalPlaces(percentile * (n - 1) * 100)}`;
  const endPercent = `${_twoDecimalPlaces(percentile * n * 100)}%`;
  return t('quantileOfData', {
    startPercent,
    endPercent,
    scope: TEXT_PATH,
    ordinal: TEXT.ordinals[String(n)],
    quantile: TEXT.quantiles[String(Math.round(1 / percentile))],
  });
}

export default function QuantileRangeRow({
  range,
  rangeIdx,
  ruleId,
}: Props): React.Node {
  const dispatch = React.useContext(DataActionRulesDispatch);
  const onChangeRange = newRange =>
    dispatch({
      newRange,
      ruleId,
      rangeIdx,
      type: 'QUANTILE_CHANGE',
    });

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
      {_quantileToString(range)}
      <ColorValueRulesBlock
        color={range.color}
        onColorChange={onColorChange}
        transformedText={range.transformedText}
        onTextValueChange={onTextValueChange}
      />
    </Group.Horizontal>
  );
}
