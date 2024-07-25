// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { BandBound } from 'models/visualizations/LineGraph/LineGraphSettings';

type Props = {
  bound: { fieldId: string, type: 'field' },
  onBoundChange: BandBound => void,
  seriesSettings: SeriesSettings,
};

export default function FieldBoundControl({
  bound,
  onBoundChange,
  seriesSettings,
}: Props): React.Node {
  const onSelectedFieldChange = React.useCallback(
    (fieldId: string) => onBoundChange({ ...bound, fieldId }),
    [bound, onBoundChange],
  );
  const seriesObjects = seriesSettings.seriesObjects();
  return (
    <div className="field-bound-control">
      <Dropdown
        buttonWidth="100%"
        onSelectionChange={onSelectedFieldChange}
        value={bound.fieldId}
      >
        {seriesSettings.seriesOrder().map(fieldId => (
          <Dropdown.Option key={fieldId} value={fieldId}>
            {seriesObjects[fieldId].label()}
          </Dropdown.Option>
        ))}
      </Dropdown>
    </div>
  );
}
