// @flow
import * as React from 'react';

import ColorBlock from 'components/ui/ColorBlock';
import Dropdown from 'components/ui/Dropdown';
import InputText from 'components/ui/InputText';
import TooltipControlWrapper from 'components/visualizations/LineGraph/LineGraphControlsBlock/BandSettingsControl/TooltipControlWrapper';
import type { BandBound } from 'models/visualizations/LineGraph/LineGraphSettings';
import type { ColorResult } from 'components/ui/ColorBlock';

type Props = {
  bound: {
    axis: 'y1Axis' | 'y2Axis',
    color: string | void,
    value: number,
    type: 'value',
  },
  onBoundChange: BandBound => void,
};

const TEXT = {
  axis: 'Axis',
  color: 'Value line color (optional)',
  placeholder: 'e.g. 100',
  title: 'Value',
};

function castValueToNumber(value: string): number | void {
  const numericValue = Number(value);
  return !Number.isNaN(numericValue) && value !== '' ? numericValue : undefined;
}

export default function ValueBoundControl({
  bound,
  onBoundChange,
}: Props): React.Node {
  const onAxisChange = React.useCallback(
    (axis: 'y1Axis' | 'y2Axis') => onBoundChange({ ...bound, axis }),
    [bound, onBoundChange],
  );
  const onBoundColorChange = React.useCallback(
    (color: ColorResult) => onBoundChange({ ...bound, color: color.hex }),
    [bound, onBoundChange],
  );
  const onBoundColorRemove = React.useCallback(
    () => onBoundChange({ ...bound, color: undefined }),
    [bound, onBoundChange],
  );
  const onValueChange = React.useCallback(
    (rawValue: string) => {
      const value = castValueToNumber(rawValue.trim());
      if (value !== undefined) {
        onBoundChange({ ...bound, value });
      }
    },
    [bound, onBoundChange],
  );

  return (
    <div className="value-bound-control">
      <TooltipControlWrapper text={TEXT.title}>
        <InputText.Uncontrolled
          className="value-bound-control__value-input"
          debounce
          initialValue={bound.value === undefined ? '' : `${bound.value}`}
          placeholder={TEXT.placeholder}
          onChange={onValueChange}
          type="number"
        />
      </TooltipControlWrapper>
      <TooltipControlWrapper text={TEXT.axis}>
        <Dropdown
          defaultDisplayContent={bound.axis}
          onSelectionChange={onAxisChange}
          value={bound.axis}
        >
          <Dropdown.Option value="y1Axis">Y1</Dropdown.Option>
          <Dropdown.Option value="y2Axis">Y2</Dropdown.Option>
        </Dropdown>
      </TooltipControlWrapper>
      <TooltipControlWrapper text={TEXT.color}>
        <ColorBlock
          // TODO(david): Move towards using null to represent no color as
          // that is a valid explicit slection
          color={bound.color === undefined ? null : bound.color}
          enableColorPicker
          onColorChange={onBoundColorChange}
          onColorRemove={onBoundColorRemove}
        />
      </TooltipControlWrapper>
    </div>
  );
}
