// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';
import RadioControl from 'components/visualizations/common/controls/RadioControl';
import RadioGroup from 'components/ui/RadioGroup';

type Props = {
  breakdown: 'dimension' | 'field',

  // NOTE(stephen): This callback is less specific than I would like. It should
  // ideally be `('dimension' | 'field') => void` but our controls change
  // logic is limited.
  onBreakdownChange: string => void,

  disabled?: boolean,
  label?: string,
  labelTooltip?: string | void,
};

export default function PivotBreakdownControl({
  breakdown,
  onBreakdownChange,

  disabled = false,
  label = I18N.text('Breakdown results by'),
  labelTooltip = undefined,
}: Props): React.Node {
  const controlLabel = (
    <Group.Horizontal spacing="none">
      {label}
      {labelTooltip && <InfoTooltip text={labelTooltip} />}
    </Group.Horizontal>
  );

  return (
    <RadioControl
      controlKey="_"
      label={controlLabel}
      onValueChange={(_, value) => onBreakdownChange(value)}
      value={breakdown}
    >
      <RadioGroup.Item disabled={disabled} value="dimension">
        <I18N id="dimensionBreakdown">Grouping</I18N>
      </RadioGroup.Item>
      <RadioGroup.Item disabled={disabled} value="field">
        <I18N id="fieldBreakdown">Field</I18N>
      </RadioGroup.Item>
    </RadioControl>
  );
}
