// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import { autobind } from 'decorators';
import { noop } from 'util/util';
import type Configuration from 'services/models/Configuration';
import type { ChildProps } from 'components/AdminApp/ConfigurationTab/ConfigurationEntry';

const TEXT = t('admin_app.configuration.flagConfiguration');
const KEY_TEXT = t('admin_app.configuration.keys');

const FLAG_OPTIONS = {
  enabled: TEXT.enabled,
  disabled: TEXT.disabled,
};

export default class FlagControl extends React.PureComponent<ChildProps> {
  static defaultProps: {
    onConfigurationUpdated: (updatedValue: Configuration) => void,
  } = {
    onConfigurationUpdated: noop,
  };

  @autobind
  toggleConfiguration(selectedValue: string) {
    const { configuration } = this.props;
    const updatedValue: boolean = selectedValue === TEXT.enabled;
    const updatedConfiguration: Configuration = configuration.value(
      updatedValue,
    );
    this.props.onConfigurationUpdated(updatedConfiguration);
  }

  render(): React.Node {
    const { configuration, testId } = this.props;
    const value = configuration.value();

    const flagOptions = Object.keys(FLAG_OPTIONS).map(element => {
      const option = FLAG_OPTIONS[element];
      return (
        <Dropdown.Option key={option} value={option}>
          {option}
        </Dropdown.Option>
      );
    });

    const dropdownText: string = t(
      'admin_app.configuration.flagConfiguration.currentValueLabel',
      {
        key: KEY_TEXT[configuration.key()],
      },
    );

    return (
      <Group.Vertical spacing="s">
        {dropdownText}
        <Dropdown
          defaultDisplayContent={value ? TEXT.enabled : TEXT.disabled}
          value={value ? TEXT.enabled : TEXT.disabled}
          onSelectionChange={this.toggleConfiguration}
          testId={testId}
        >
          {flagOptions}
        </Dropdown>
      </Group.Vertical>
    );
  }
}
