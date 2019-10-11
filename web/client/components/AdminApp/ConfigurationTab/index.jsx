// @flow
import * as React from 'react';
import Promise from 'bluebird';

import Configuration from 'services/models/Configuration';
import ConfigurationEntry from 'components/AdminApp/ConfigurationTab/ConfigurationEntry';
import ConfigurationService, {
  CONFIGURATION_KEY,
} from 'services/ConfigurationService';
import DatasourceControl from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/DatasourceControl';
import FlagControl from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/FlagControl';
import TextControl from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/TextControl';
import UserSelectControl from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/UserSelectControl';
import ZenMap from 'util/ZenModel/ZenMap';
import autobind from 'decorators/autobind';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import type { ConfigurationKey } from 'services/ConfigurationService';

const TEXT = t('admin_app.configuration');
const KEY_TEXT = TEXT.keys;

type Props = {
  getConfiguration: (key: ConfigurationKey) => Promise<Configuration>,

  resetConfiguration: (key: ConfigurationKey) => Promise<Configuration>,

  // eslint-disable-next-line max-len
  setConfiguration: (
    updatedConfiguration: Configuration,
  ) => Promise<Configuration>,
};

type State = {
  configurationValues: ZenMap<Configuration>,
};

class ConfigurationTab extends React.PureComponent<Props, State> {
  static defaultProps = {
    getConfiguration: ConfigurationService.getConfiguration,
    setConfiguration: ConfigurationService.setConfiguration,
    resetConfiguration: ConfigurationService.resetConfiguration,
  };

  state = {
    configurationValues: ZenMap.create(),
  };

  componentDidMount() {
    this.fetchAndSetConfigurations();
  }

  fetchAndSetConfigurations() {
    return Promise.all(
      Object.keys(CONFIGURATION_KEY).map(key =>
        this.fetchAndSetConfiguration(CONFIGURATION_KEY[key]),
      ),
    );
  }

  fetchAndSetConfiguration(configurationKey: ConfigurationKey): Promise<void> {
    const { getConfiguration } = this.props;

    return new Promise(resolve => {
      getConfiguration(configurationKey).then((setting: Configuration) => {
        this.setState(
          (previousState: State) => {
            const { configurationValues } = previousState;
            return {
              configurationValues: configurationValues.set(
                configurationKey,
                setting,
              ),
            };
          },
          () => resolve(),
        );
      });
    });
  }

  @autobind
  resetConfiguration(configuration: Configuration): void {
    const { key } = configuration.modelValues();

    this.props
      .resetConfiguration(key)
      .then((resetConfiguration: Configuration) => {
        this.setState(
          (previousState: State) => {
            const { configurationValues } = previousState;
            return {
              configurationValues: configurationValues.set(
                key,
                resetConfiguration,
              ),
            };
          },
          () => window.toastr.success(TEXT.valueSuccessfullyReset),
        );
      })
      .catch(error => {
        window.toastr.error(TEXT.updateError);
        console.error(error);
      });
  }

  @autobind
  setConfiguration(configuration: Configuration) {
    this.props
      .setConfiguration(configuration)
      .then((newConfigurationFromServer: Configuration) => {
        this.setState(
          (previousState: State) => {
            const previousConfigurationValues =
              previousState.configurationValues;
            return {
              configurationValues: previousConfigurationValues.set(
                newConfigurationFromServer.key(),
                newConfigurationFromServer,
              ),
            };
          },
          () => {
            const updateText = t('admin_app.configuration.valueUpdated', {
              key: KEY_TEXT[newConfigurationFromServer.key()],
            });
            window.toastr.success(updateText);
          },
        );
      })
      .catch(error => {
        window.toastr.error(TEXT.updateError);
        console.error(error);
      });
  }

  renderPublicAccessControl() {
    const { configurationValues } = this.state;
    const publicAccessConfiguration = configurationValues.get(
      CONFIGURATION_KEY.PUBLIC_ACCESS,
    );

    if (!publicAccessConfiguration) {
      return null;
    }

    return (
      <ConfigurationEntry
        isDestructiveAction
        configuration={publicAccessConfiguration}
        configurationTitle={KEY_TEXT[publicAccessConfiguration.key()]}
        onConfigurationUpdated={this.setConfiguration}
        onResetConfiguration={this.resetConfiguration}
        destructiveChangeWarning={
          TEXT.warningText[publicAccessConfiguration.key()]
        }
      >
        <FlagControl configuration={publicAccessConfiguration} />
      </ConfigurationEntry>
    );
  }

  renderDefaultUrlControl() {
    const { configurationValues } = this.state;

    const defaultUrlConfiguration = configurationValues.get(
      CONFIGURATION_KEY.DEFAULT_URL,
    );

    if (!defaultUrlConfiguration) {
      return null;
    }

    return (
      <ConfigurationEntry
        configuration={defaultUrlConfiguration}
        configurationTitle={KEY_TEXT[defaultUrlConfiguration.key()]}
        onConfigurationUpdated={this.setConfiguration}
        onResetConfiguration={this.resetConfiguration}
      >
        <TextControl configuration={defaultUrlConfiguration} />
      </ConfigurationEntry>
    );
  }

  renderCrispEnabledControl() {
    const { configurationValues } = this.state;
    const crispEnabledConfiguration = configurationValues.get(
      CONFIGURATION_KEY.CRISP_ENABLED,
    );

    if (!crispEnabledConfiguration) {
      return null;
    }

    return (
      <ConfigurationEntry
        configuration={crispEnabledConfiguration}
        configurationTitle={KEY_TEXT[crispEnabledConfiguration.key()]}
        onConfigurationUpdated={this.setConfiguration}
        onResetConfiguration={this.resetConfiguration}
      >
        <FlagControl configuration={crispEnabledConfiguration} />
      </ConfigurationEntry>
    );
  }

  renderCrispIdControl() {
    const { configurationValues } = this.state;

    const crispIdConfiguration = configurationValues.get(
      CONFIGURATION_KEY.CRISP_ID,
    );

    if (!crispIdConfiguration) {
      return null;
    }

    return (
      <ConfigurationEntry
        configuration={crispIdConfiguration}
        configurationTitle={KEY_TEXT[crispIdConfiguration.key()]}
        onConfigurationUpdated={this.setConfiguration}
        onResetConfiguration={this.resetConfiguration}
      >
        <TextControl configuration={crispIdConfiguration} />
      </ConfigurationEntry>
    );
  }

  renderProjectManagerControl() {
    const { configurationValues } = this.state;

    const projectManagersConfiguration = configurationValues.get(
      CONFIGURATION_KEY.PROJECT_MANAGER_IDS,
    );

    if (!projectManagersConfiguration) {
      return null;
    }

    return (
      <ConfigurationEntry
        configuration={projectManagersConfiguration}
        configurationTitle={KEY_TEXT[projectManagersConfiguration.key()]}
        onConfigurationUpdated={this.setConfiguration}
        onResetConfiguration={this.resetConfiguration}
      >
        <UserSelectControl configuration={projectManagersConfiguration} />
      </ConfigurationEntry>
    );
  }

  renderDatasourceControl() {
    const { configurationValues } = this.state;
    const datasourceConfiguration = configurationValues.get(
      CONFIGURATION_KEY.CUR_DATASOURCE,
    );
    if (!datasourceConfiguration) {
      return null;
    }

    return (
      <ConfigurationEntry
        configuration={datasourceConfiguration}
        configurationTitle={KEY_TEXT[datasourceConfiguration.key()]}
        destructiveChangeWarning={
          TEXT.warningText[datasourceConfiguration.key()]
        }
        onConfigurationUpdated={this.setConfiguration}
        onResetConfiguration={this.resetConfiguration}
        isDestructiveAction
      >
        <DatasourceControl configuration={datasourceConfiguration} />
      </ConfigurationEntry>
    );
  }

  render() {
    // TODO(vedant) - Although fine for now, we should think of an extensible
    // way of representing disparate configuration settings.
    return (
      <form>
        <fieldset>
          {this.renderPublicAccessControl()}
          {this.renderDefaultUrlControl()}
          {this.renderCrispEnabledControl()}
          {this.renderCrispIdControl()}
          {this.renderProjectManagerControl()}
          {this.renderDatasourceControl()}
        </fieldset>
      </form>
    );
  }
}

export default withScriptLoader(ConfigurationTab, VENDOR_SCRIPTS.toastr);
