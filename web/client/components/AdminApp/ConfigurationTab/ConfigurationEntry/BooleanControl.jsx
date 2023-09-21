// @flow
import * as React from 'react';

import ToggleSwitch from 'components/ui/ToggleSwitch';
import type Configuration from 'services/models/Configuration';

type Props = {
  configuration: Configuration,
  label: string,
  onConfigurationUpdated: (updatedValue: Configuration) => void,
};

const BooleanControl = ({
  configuration,
  label,
  onConfigurationUpdated,
}: Props) => {
  const value = configuration.value();

  const onChange = () => {
    onConfigurationUpdated(configuration.value(!value));
  };
  return (
    <ToggleSwitch
      className="configuration-tab__toggle-switch"
      disabledLabel={label}
      displayLabels="right"
      enabledLabel={label}
      onChange={onChange}
      value={value}
    />
  );
};

export default (React.memo(BooleanControl): React.AbstractComponent<Props>);
