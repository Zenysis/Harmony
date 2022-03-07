// @flow
import * as React from 'react';

import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

type Props = ControlsBlockProps<'SUNBURST'>;

export default function SunburstControlsBlock({
  controls,
  fields,
  onControlsSettingsChange,
}: Props): React.Node {
  return (
    <SingleFieldSelectionControl
      controlKey="selectedField"
      onValueChange={onControlsSettingsChange}
      value={controls.selectedField()}
      fields={fields}
    />
  );
}
