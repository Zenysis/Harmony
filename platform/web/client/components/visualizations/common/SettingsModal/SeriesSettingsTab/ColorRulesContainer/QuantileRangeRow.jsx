// @flow
import * as React from 'react';
import numeral from 'numeral';

import ColorValueRulesBlock from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/ColorValueRulesBlock';
import DataActionRulesDispatch from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import {
  ORDINALS,
  QUANTILES,
} from 'models/core/QueryResultSpec/ValueRule/InQuantileRule';
import type { QuantileRange } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';

type Props = {
  range: QuantileRange,
  rangeIdx: number,
  ruleId: string,
};

// format a number to two decimal places only if necessary
function _twoDecimalPlaces(num: number): string {
  return numeral(num).format('0,0.[00]');
}

function _quantileToString(range: QuantileRange) {
  const { n, percentile } = range;
  const startPercent = `${_twoDecimalPlaces(percentile * (n - 1) * 100)}`;
  const endPercent = `${_twoDecimalPlaces(percentile * n * 100)}%`;

  return I18N.text(
    '%(ordinal)s %(quantile)s (%(startPercent)s-%(endPercent)s of data)',
    {
      endPercent,
      startPercent,
      ordinal: ORDINALS[String(n)],
      quantile: QUANTILES[String(Math.round(1 / percentile))],
    },
  );
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
      rangeIdx,
      ruleId,
      type: 'QUANTILE_CHANGE',
    });

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
      {_quantileToString(range)}
      <ColorValueRulesBlock
        color={range.color}
        onColorChange={onColorChange}
        onTextValueChange={onTextValueChange}
        transformedText={range.transformedText}
      />
    </Group.Horizontal>
  );
}
