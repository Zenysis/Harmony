// @flow
import * as React from 'react';
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import BooleanControl from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/BooleanControl';
import Configuration from 'services/models/Configuration';
import ConfigurationEntry from 'components/AdminApp/ConfigurationTab/ConfigurationEntry';
import ConfigurationService, {
  CONFIGURATION_KEY,
} from 'services/ConfigurationService';
import DataCatalogControlBlock from 'components/AdminApp/ConfigurationTab/DataCatalogControlBlock';
import DatasourceControl from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/DatasourceControl';
import FlagControl from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/FlagControl';
import Group from 'components/ui/Group';
import TextControl from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/TextControl';
import Toaster from 'components/ui/Toaster';
import UserSelectControl from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/UserSelectControl';
import autobind from 'decorators/autobind';
import { ENABLED_DATA_CATALOG_APP } from 'components/DataCatalogApp/flags';
import type { ConfigurationKey } from 'services/ConfigurationService';

const TEXT = t('admin_app.configuration');
const KEY_TEXT = TEXT.keys;

type DefaultProps = {
  getConfiguration: typeof ConfigurationService.getConfiguration,
  resetConfiguration: typeof ConfigurationService.resetConfiguration,
  setConfiguration: typeof ConfigurationService.setConfiguration,
};

type Props = DefaultProps;

type State = {
  configurationValues: Zen.Map<Configuration>,
};

export default class ConfigurationTab extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps: DefaultProps = {
    getConfiguration: ConfigurationService.getConfiguration,
    resetConfiguration: ConfigurationService.resetConfiguration,
    setConfiguration: ConfigurationService.setConfiguration,
  };

  state: State = {
    configurationValues: Zen.Map.create(),
  };

  componentDidMount() {
    this.fetchAndSetConfigurations();
  }

  fetchAndSetConfigurations(): Promise<$ReadOnlyArray<void>> {
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
  updateLocalConfiguration(configuration: Configuration) {
    this.setState((previousState: State) => {
      const { configurationValues } = previousState;
      return {
        configurationValues: configurationValues.set(
          configuration.key(),
          configuration,
        ),
      };
    });
  }

  @autobind
  resetConfiguration(configuration: Configuration): Promise<void> {
    const { key } = configuration.modelValues();

    return this.props
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
          () => Toaster.success(TEXT.valueSuccessfullyReset),
        );
      })
      .catch(error => {
        Toaster.error(TEXT.updateError);
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
            Toaster.success(updateText);
          },
        );
      })
      .catch(error => {
        Toaster.error(TEXT.updateError);
        console.error(error);
      });
  }

  maybeRenderDataCatalogControl(): React.Node {
    // NOTE(yitian): only enable on on certain instances for now.
    return ENABLED_DATA_CATALOG_APP && <DataCatalogControlBlock />;
  }

  renderPublicAccessControl(): React.Node {
    const { configurationValues } = this.state;
    const publicAccessConfiguration = configurationValues.get(
      CONFIGURATION_KEY.PUBLIC_ACCESS,
    );

    if (!publicAccessConfiguration) {
      return null;
    }

    return (
      <ConfigurationEntry
        useCardWrapper
        isDestructiveAction
        configuration={publicAccessConfiguration}
        configurationTitle={KEY_TEXT[publicAccessConfiguration.key()]}
        onConfigurationUpdated={this.setConfiguration}
        onResetConfiguration={this.resetConfiguration}
        destructiveChangeWarning={
          TEXT.warningText[publicAccessConfiguration.key()]
        }
      >
        <FlagControl
          configuration={publicAccessConfiguration}
          onConfigurationUpdated={this.setConfiguration}
          testId="public-access-configuration"
        />
      </ConfigurationEntry>
    );
  }

  renderDefaultUrlControl(): React.Node {
    const { configurationValues } = this.state;

    const defaultUrlConfiguration = configurationValues.get(
      CONFIGURATION_KEY.DEFAULT_URL,
    );

    if (!defaultUrlConfiguration) {
      return null;
    }

    const primaryButtonText: string = t(
      'admin_app.configuration.textConfiguration.saveText',
      {
        key: KEY_TEXT[defaultUrlConfiguration.key()],
      },
    );

    return (
      <ConfigurationEntry
        useCardWrapper
        className="configuration-tab__text-control-body"
        configuration={defaultUrlConfiguration}
        configurationTitle={KEY_TEXT[defaultUrlConfiguration.key()]}
        enablePrimaryButton
        onConfigurationUpdated={this.setConfiguration}
        onPrimaryAction={() => this.setConfiguration(defaultUrlConfiguration)}
        onResetConfiguration={this.resetConfiguration}
        primaryButtonText={primaryButtonText}
      >
        <TextControl
          configuration={defaultUrlConfiguration}
          updateLocalConfiguration={this.updateLocalConfiguration}
        />
      </ConfigurationEntry>
    );
  }

  renderKeepMeSignedInControl(): React.Node {
    const { configurationValues } = this.state;

    const defaultKeepMeSignedIn = configurationValues.get(
      CONFIGURATION_KEY.KEEP_ME_SIGNED,
    );

    if (!defaultKeepMeSignedIn) {
      return null;
    }
    return (
      <ConfigurationEntry
        useCardWrapper
        configuration={defaultKeepMeSignedIn}
        configurationTitle={KEY_TEXT[defaultKeepMeSignedIn.key()]}
        onConfigurationUpdated={this.setConfiguration}
        onResetConfiguration={this.resetConfiguration}
      >
        <BooleanControl
          label={TEXT.keepMeSignedInLabel}
          configuration={defaultKeepMeSignedIn}
          onConfigurationUpdated={this.setConfiguration}
        />
      </ConfigurationEntry>
    );
  }

  renderProjectManagerControl(): React.Node {
    const { configurationValues } = this.state;

    const projectManagersConfiguration = configurationValues.get(
      CONFIGURATION_KEY.PROJECT_MANAGER_IDS,
    );

    if (!projectManagersConfiguration) {
      return null;
    }

    const primaryButtonText: string = t(
      'admin_app.configuration.textConfiguration.saveText',
      {
        key: KEY_TEXT[projectManagersConfiguration.key()],
      },
    );

    return (
      <ConfigurationEntry
        useCardWrapper
        configuration={projectManagersConfiguration}
        configurationTitle={KEY_TEXT[projectManagersConfiguration.key()]}
        enablePrimaryButton
        onConfigurationUpdated={this.setConfiguration}
        onPrimaryAction={() =>
          this.setConfiguration(projectManagersConfiguration)
        }
        onResetConfiguration={this.resetConfiguration}
        primaryButtonText={primaryButtonText}
      >
        <UserSelectControl
          configuration={projectManagersConfiguration}
          onConfigurationUpdated={this.setConfiguration}
          updateLocalConfiguration={this.updateLocalConfiguration}
        />
      </ConfigurationEntry>
    );
  }

  renderDatasourceControl(): React.Node {
    const { configurationValues } = this.state;
    const datasourceConfiguration = configurationValues.get(
      CONFIGURATION_KEY.CUR_DATASOURCE,
    );
    if (!datasourceConfiguration) {
      return null;
    }

    return (
      <ConfigurationEntry
        useCardWrapper
        configuration={datasourceConfiguration}
        configurationTitle={KEY_TEXT[datasourceConfiguration.key()]}
        destructiveChangeWarning={
          TEXT.warningText[datasourceConfiguration.key()]
        }
        onConfigurationUpdated={this.setConfiguration}
        onResetConfiguration={this.resetConfiguration}
        isDestructiveAction
      >
        <DatasourceControl
          configuration={datasourceConfiguration}
          onConfigurationUpdated={this.setConfiguration}
        />
      </ConfigurationEntry>
    );
  }

  renderCaseManagementControl(): React.Node {
    return null;
  }

  render(): React.Node {
    // TODO(vedant) - Although fine for now, we should think of an extensible
    // way of representing disparate configuration settings.
    return (
      <form>
        <Group.Vertical spacing="l">
          {this.renderPublicAccessControl()}
          {this.renderDefaultUrlControl()}
          {this.renderKeepMeSignedInControl()}
          {this.renderProjectManagerControl()}
          {this.renderDatasourceControl()}
          {this.renderCaseManagementControl()}
          {this.maybeRenderDataCatalogControl()}
        </Group.Vertical>
      </form>
    );
  }
}
