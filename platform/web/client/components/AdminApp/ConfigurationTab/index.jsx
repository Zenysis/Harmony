// @flow
import * as React from 'react';
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import BooleanControl from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/BooleanControl';
import Configuration from 'services/models/Configuration';
import ConfigurationEntry from 'components/AdminApp/ConfigurationTab/ConfigurationEntry';
import ConfigurationService, {
  CONFIGURATION_KEY,
  CONFIGURATION_DISPLAY_TEXT,
  CONFIGURATION_WARNING_TEXT,
} from 'services/ConfigurationService';
import DatasourceControl from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/DatasourceControl';
import FlagControl from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/FlagControl';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import SelfServeControlBlock from 'components/AdminApp/ConfigurationTab/SelfServeControlBlock';
import TextControl from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/TextControl';
import Toaster from 'components/ui/Toaster';
import UserSelectControl from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/UserSelectControl';
import autobind from 'decorators/autobind';
import type { ConfigurationKey } from 'services/ConfigurationService';

type State = {
  configurationValues: Zen.Map<Configuration>,
};

export default class ConfigurationTab extends React.PureComponent<{}, State> {
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
    return new Promise(resolve => {
      ConfigurationService.getConfiguration(configurationKey).then(
        (setting: Configuration) => {
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
        },
      );
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

    return ConfigurationService.resetConfiguration(key)
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
          () =>
            Toaster.success(
              I18N.text(
                'The configuration setting has been reset to its default value.',
              ),
            ),
        );
      })
      .catch(error => {
        Toaster.error(
          I18N.text(
            'There was an error updating settings. Contact an Administrator for assistance.',
          ),
        );
        console.error(error);
      });
  }

  @autobind
  setConfiguration(configuration: Configuration) {
    ConfigurationService.setConfiguration(configuration)
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
            const updateText = I18N.text('%(key)s has been updated.', {
              key: CONFIGURATION_DISPLAY_TEXT[newConfigurationFromServer.key()],
            });
            Toaster.success(updateText);
          },
        );
      })
      .catch(error => {
        Toaster.error(
          I18N.textById(
            'There was an error updating settings. Contact an Administrator for assistance.',
          ),
        );
        console.error(error);
      });
  }

  maybeRenderDataCatalogControl(): React.Node {
    return <SelfServeControlBlock />;
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
        configuration={publicAccessConfiguration}
        configurationTitle={
          CONFIGURATION_DISPLAY_TEXT[publicAccessConfiguration.key()]
        }
        destructiveChangeWarning={
          CONFIGURATION_WARNING_TEXT[publicAccessConfiguration.key()]
        }
        isDestructiveAction
        onConfigurationUpdated={this.setConfiguration}
        onResetConfiguration={this.resetConfiguration}
        useCardWrapper
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

    const primaryButtonText: string = I18N.text('Save %(key)s', {
      key: CONFIGURATION_DISPLAY_TEXT[defaultUrlConfiguration.key()],
    });

    return (
      <ConfigurationEntry
        className="configuration-tab__text-control-body"
        configuration={defaultUrlConfiguration}
        configurationTitle={
          CONFIGURATION_DISPLAY_TEXT[defaultUrlConfiguration.key()]
        }
        enablePrimaryButton
        onConfigurationUpdated={this.setConfiguration}
        onPrimaryAction={() => this.setConfiguration(defaultUrlConfiguration)}
        onResetConfiguration={this.resetConfiguration}
        primaryButtonText={primaryButtonText}
        useCardWrapper
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
        configuration={defaultKeepMeSignedIn}
        configurationTitle={
          CONFIGURATION_DISPLAY_TEXT[defaultKeepMeSignedIn.key()]
        }
        onConfigurationUpdated={this.setConfiguration}
        onResetConfiguration={this.resetConfiguration}
        useCardWrapper
      >
        <BooleanControl
          configuration={defaultKeepMeSignedIn}
          label={I18N.text(
            'Automatically sign out users after 30 minutes of inactivity by default',
          )}
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

    const primaryButtonText: string = I18N.textById('Save %(key)s', {
      key: CONFIGURATION_DISPLAY_TEXT[projectManagersConfiguration.key()],
    });

    return (
      <ConfigurationEntry
        configuration={projectManagersConfiguration}
        configurationTitle={
          CONFIGURATION_DISPLAY_TEXT[projectManagersConfiguration.key()]
        }
        enablePrimaryButton
        onConfigurationUpdated={this.setConfiguration}
        onPrimaryAction={() =>
          this.setConfiguration(projectManagersConfiguration)
        }
        onResetConfiguration={this.resetConfiguration}
        primaryButtonText={primaryButtonText}
        useCardWrapper
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
        configuration={datasourceConfiguration}
        configurationTitle={
          CONFIGURATION_DISPLAY_TEXT[datasourceConfiguration.key()]
        }
        onConfigurationUpdated={this.setConfiguration}
        onResetConfiguration={this.resetConfiguration}
        useCardWrapper
      >
        <DatasourceControl
          configuration={datasourceConfiguration}
          onConfigurationUpdated={this.setConfiguration}
        />
      </ConfigurationEntry>
    );
  }

  render(): React.Node {
    // TODO - Although fine for now, we should think of an extensible
    // way of representing disparate configuration settings.
    return (
      <form>
        <Group.Vertical spacing="l">
          {this.renderPublicAccessControl()}
          {this.renderDefaultUrlControl()}
          {this.renderKeepMeSignedInControl()}
          {this.renderProjectManagerControl()}
          {this.renderDatasourceControl()}
          {this.maybeRenderDataCatalogControl()}
        </Group.Vertical>
      </form>
    );
  }
}
