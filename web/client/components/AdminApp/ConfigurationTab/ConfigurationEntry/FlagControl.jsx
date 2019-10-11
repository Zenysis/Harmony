// @flow
import * as React from 'react';

import Configuration from 'services/models/Configuration';
import Dropdown from 'components/ui/Dropdown';
import { autobind } from 'decorators';
import { noop } from 'util/util';
import type { ChildProps } from 'components/AdminApp/ConfigurationTab/ConfigurationEntry';

const TEXT = t('admin_app.configuration.flagConfiguration');
const KEY_TEXT = t('admin_app.configuration.keys');

const FLAG_OPTIONS = {
  enabled: TEXT.enabled,
  disabled: TEXT.disabled,
};

export default class FlagControl extends React.PureComponent<ChildProps> {
  static defaultProps = {
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

  render() {
    const { configuration } = this.props;
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

    const controlClassName = `configuration-flag configuration-flag-${configuration.key()}`;
    const dropdownClassName = `configuration-flag-dropdown configuration-flag-text-${configuration.key()}`;
    const textClassName = `configuration-flag-text configuration-flag-dropdown-${configuration.key()}`;

    return (
      <div className={controlClassName}>
        <div className={textClassName}>{dropdownText}</div>
        <Dropdown
          className={dropdownClassName}
          defaultDisplayContent={value ? TEXT.enabled : TEXT.disabled}
          value={value ? TEXT.enabled : TEXT.disabled}
          onSelectionChange={this.toggleConfiguration}
        >
          {flagOptions}
        </Dropdown>
      </div>
    );
  }
}
