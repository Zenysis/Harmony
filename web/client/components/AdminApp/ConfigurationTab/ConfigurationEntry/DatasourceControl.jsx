// @flow
import * as React from 'react';

import Configuration from 'services/models/Configuration';
import ConfigurationService from 'services/ConfigurationService';
import Dropdown from 'components/ui/Dropdown';
import { autobind } from 'decorators';
import { noop } from 'util/util';
import type { ChildProps } from 'components/AdminApp/ConfigurationTab/ConfigurationEntry';

const KEY_TEXT = t('admin_app.configuration.keys');

type State = {
  flagOptions: $ReadOnlyArray<string>,
  currentDatasource: string,
};

export default class DatasourceControl extends React.PureComponent<
  ChildProps,
  State,
> {
  static defaultProps = {
    onConfigurationUpdated: noop,
  };

  state = {
    flagOptions: [],
    currentDatasource: '',
  };

  componentDidMount() {
    this.loadFlags();
  }

  /**
   * Set dropdown flags to datasources.
   */
  loadFlags() {
    ConfigurationService.getDatasourceDict().then(datasources => {
      this.setState({
        flagOptions: [...datasources.datasourceList, 'LATEST_DATASOURCE'],
        currentDatasource: datasources.currentDatasource,
      });
    });
  }

  @autobind
  onDatasourceSelection(selectedValue: string) {
    const { configuration, onConfigurationUpdated } = this.props;
    const updatedConfiguration: Configuration = configuration.value(
      selectedValue,
    );
    onConfigurationUpdated(updatedConfiguration);
  }

  renderFlagOptions(): Array<React.Element<Class<Dropdown.Option<string>>>> {
    const { flagOptions } = this.state;

    return flagOptions.map(option => (
      <Dropdown.Option key={option} value={option}>
        {option}
      </Dropdown.Option>
    ));
  }

  renderDropdown() {
    const { configuration } = this.props;
    const value = configuration.value();
    const dropdownText: string = t(
      'admin_app.configuration.flagConfiguration.currentValueLabel',
      {
        key: KEY_TEXT[configuration.key()],
      },
    );

    const dropdownClassName = `configuration-flag-dropdown configuration-flag-text-${configuration.key()}`;
    const textClassName = `configuration-flag-text configuration-flag-dropdown-${configuration.key()}`;

    return (
      <div className="configuration-tab_column">
        <div className={textClassName}>{dropdownText}</div>
        <Dropdown
          className={dropdownClassName}
          defaultDisplayContent={this.state.currentDatasource}
          value={value}
          onSelectionChange={this.onDatasourceSelection}
        >
          {this.renderFlagOptions()}
        </Dropdown>
      </div>
    );
  }

  render() {
    return (
      <div className="configuration-tab__column">{this.renderDropdown()}</div>
    );
  }
}
