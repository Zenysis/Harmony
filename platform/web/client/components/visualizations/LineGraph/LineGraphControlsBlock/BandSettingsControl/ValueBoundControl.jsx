// @flow
import * as React from 'react';

import ColorBlock from 'components/ui/ColorBlock';
import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import TooltipControlWrapper from 'components/visualizations/LineGraph/LineGraphControlsBlock/BandSettingsControl/TooltipControlWrapper';
import type { BandBound } from 'models/visualizations/LineGraph/LineGraphSettings';
import type { ColorResult } from 'components/ui/ColorBlock';

type Props = {
  bound: {
    axis: 'y1Axis' | 'y2Axis',
    color: string | void,
    type: 'value',
    value: number,
  },
  onBoundChange: BandBound => void,
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
      <TooltipControlWrapper text={I18N.textById('Value')}>
        <InputText.Uncontrolled
          className="value-bound-control__value-input"
          debounce
          initialValue={bound.value === undefined ? '' : `${bound.value}`}
          onChange={onValueChange}
          placeholder={I18N.text('e.g. 100')}
          type="number"
        />
      </TooltipControlWrapper>
      <TooltipControlWrapper text={I18N.text('Axis')}>
        <Dropdown
          defaultDisplayContent={bound.axis}
          onSelectionChange={onAxisChange}
          value={bound.axis}
        >
          <Dropdown.Option value="y1Axis">Y1</Dropdown.Option>
          <Dropdown.Option value="y2Axis">Y2</Dropdown.Option>
        </Dropdown>
      </TooltipControlWrapper>
      <TooltipControlWrapper text={I18N.text('Value line color (optional)')}>
        <ColorBlock
          // TODO: Move towards using null to represent no color as
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
