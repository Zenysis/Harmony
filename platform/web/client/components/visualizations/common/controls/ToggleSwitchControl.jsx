// @flow
import * as React from 'react';

import Control from 'components/visualizations/common/controls/Control';
import I18N from 'lib/I18N';
import ToggleSwitch from 'components/ui/ToggleSwitch';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props = {
  ...VisualizationControlProps<boolean>,
  label: string,
};

export default function ToggleSwitchControl({
  activated = true,
  controlKey,
  label,
  onValueChange,
  value,
}: Props): React.Node {
  const onChange = () => onValueChange(controlKey, !value);

  return (
    <Control htmlFor={controlKey} label={label}>
      <ToggleSwitch
        activated={activated}
        disabledLabel={I18N.text('No')}
        displayLabels="right"
        enabledLabel={I18N.text('Yes')}
        id={controlKey}
        onChange={onChange}
        value={value}
      />
    </Control>
  );
}
