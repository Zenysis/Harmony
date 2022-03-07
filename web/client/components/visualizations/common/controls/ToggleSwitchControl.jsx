// @flow
import * as React from 'react';

import Control from 'components/visualizations/common/controls/Control';
import ToggleSwitch from 'components/ui/ToggleSwitch';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props = {
  ...VisualizationControlProps<boolean>,
  label: string,
};

export default function ToggleSwitchControl({
  controlKey,
  label,
  onValueChange,
  value,
}: Props): React.Node {
  const onChange = () => onValueChange(controlKey, !value);

  return (
    <Control htmlFor={controlKey} label={label}>
      <ToggleSwitch
        id={controlKey}
        value={value}
        onChange={onChange}
        enabledLabel="Yes"
        disabledLabel="No"
        displayLabels="right"
      />
    </Control>
  );
}
