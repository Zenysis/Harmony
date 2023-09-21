// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import { CONFIGURATION_DISPLAY_TEXT } from 'services/ConfigurationService';
import { noop } from 'util/util';
import type Configuration from 'services/models/Configuration';
import type { ChildProps } from 'components/AdminApp/ConfigurationTab/ConfigurationEntry';

const FLAG_OPTIONS = {
  disabled: I18N.text('Disabled'),
  enabled: I18N.text('Enabled'),
};

type Props = {
  ...ChildProps,
  configuration: Configuration,
  onConfigurationUpdated?: (updatedValue: Configuration) => void,
  testId?: string,
};

export default function FlagControl({
  configuration,
  onConfigurationUpdated = noop,
  testId,
}: Props): React.Node {
  const toggleConfiguration = (selectedValue: string) => {
    const updatedValue: boolean = selectedValue === FLAG_OPTIONS.enabled;
    const updatedConfiguration: Configuration = configuration.value(
      updatedValue,
    );
    onConfigurationUpdated(updatedConfiguration);
  };

  const flagOptions = Object.keys(FLAG_OPTIONS).map(element => {
    const option = FLAG_OPTIONS[element];
    return (
      <Dropdown.Option key={option} value={option}>
        {option}
      </Dropdown.Option>
    );
  });

  const value = configuration.value();
  const dropdownText: string = I18N.textById('%(key)s is Currently:', {
    key: CONFIGURATION_DISPLAY_TEXT[configuration.key()],
  });

  return (
    <Group.Vertical spacing="s">
      {dropdownText}
      <Dropdown
        defaultDisplayContent={
          value ? FLAG_OPTIONS.enabled : FLAG_OPTIONS.disabled
        }
        onSelectionChange={toggleConfiguration}
        testId={testId}
        value={value ? FLAG_OPTIONS.enabled : FLAG_OPTIONS.disabled}
      >
        {flagOptions}
      </Dropdown>
    </Group.Vertical>
  );
}
