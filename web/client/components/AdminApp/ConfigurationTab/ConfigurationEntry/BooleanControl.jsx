// @flow
import * as React from 'react';

import ToggleSwitch from 'components/ui/ToggleSwitch';
import type Configuration from 'services/models/Configuration';

type Props = {
  configuration: Configuration,
  onConfigurationUpdated: (updatedValue: Configuration) => void,
  label: string,
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
      displayLabels="right"
      disabledLabel={label}
      enabledLabel={label}
      onChange={onChange}
      value={value}
    />
  );
};

export default (React.memo(BooleanControl): React.AbstractComponent<Props>);
