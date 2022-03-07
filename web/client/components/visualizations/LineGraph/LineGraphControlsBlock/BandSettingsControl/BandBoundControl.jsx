// @flow
import * as React from 'react';

import FieldBoundControl from 'components/visualizations/LineGraph/LineGraphControlsBlock/BandSettingsControl/FieldBoundControl';
import RadioGroup from 'components/ui/RadioGroup';
import ValueBoundControl from 'components/visualizations/LineGraph/LineGraphControlsBlock/BandSettingsControl/ValueBoundControl';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { BandBound } from 'models/visualizations/LineGraph/LineGraphSettings';

type Props = {
  bound: BandBound,
  onBoundChange: BandBound => void,
  seriesSettings: SeriesSettings,
};

const TEXT = {
  fieldOption: 'Indicator',
  valueOption: 'Value',
};

export default function BandBoundControl({
  bound,
  onBoundChange,
  seriesSettings,
}: Props): React.Node {
  const defaultFieldId = seriesSettings.seriesOrder()[0];
  const onBoundTypeChange = React.useCallback(
    (type: 'field' | 'value') => {
      const newBound =
        type === 'field'
          ? { fieldId: defaultFieldId, type: 'field' }
          : { axis: 'y1Axis', color: '#cccccc', value: 0, type: 'value' };
      onBoundChange(newBound);
    },
    [defaultFieldId, onBoundChange],
  );

  return (
    <div className="band-bound-control">
      <RadioGroup
        className="band-bound-control__bound-type-control"
        onChange={onBoundTypeChange}
        value={bound.type}
      >
        <RadioGroup.Item value="field">{TEXT.fieldOption}</RadioGroup.Item>
        <RadioGroup.Item value="value">{TEXT.valueOption}</RadioGroup.Item>
      </RadioGroup>
      {bound.type === 'field' && (
        <FieldBoundControl
          bound={bound}
          onBoundChange={onBoundChange}
          seriesSettings={seriesSettings}
        />
      )}
      {bound.type === 'value' && (
        <ValueBoundControl bound={bound} onBoundChange={onBoundChange} />
      )}
    </div>
  );
}
