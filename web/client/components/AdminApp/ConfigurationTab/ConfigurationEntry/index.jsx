// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import Card from 'components/ui/Card';
import Configuration from 'services/models/Configuration';
import DestructiveActionModal from 'components/common/DestructiveActionModal';
import ResetConfigurationModal from 'components/AdminApp/ConfigurationTab/ResetConfigurationModal';
import autobind from 'decorators/autobind';

const TEXT = t('admin_app.configuration');
const HELP_TEXT = TEXT.helpText;

export type ChildProps = {
  configuration: Configuration,
  onConfigurationUpdated: (updatedValue: Configuration) => void,
};

type Props = {
  children: React.MixedElement,
  configuration: Configuration,
  configurationTitle: string,
  onConfigurationUpdated: (updatedValue: Configuration) => void,
  onResetConfiguration: (configurationToReset: Configuration) => void,

  isDestructiveAction: boolean,
  destructiveChangeWarning: string,
};

type State = {
  destructiveActionModalVisible: boolean,
  interimConfiguration: Configuration,
  resetModalVisible: boolean,
};

// TODO(stephen): This component has a few anti-patterns (modification of child
// props, weird constant requirements) that need to be cleaned up.
export default class ConfigurationEntry extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps = {
    isDestructiveAction: false,
    destructiveChangeWarning: '',
  };

  emptyConfiguration = Configuration.create({
    defaultValue: '',
    description: '',
    key: this.props.configuration.key(),
    value: '',
  });

  state = {
    destructiveActionModalVisible: false,
    interimConfiguration: this.emptyConfiguration,
    resetModalVisible: false,
  };

  @autobind
  openResetModal(): void {
    this.setState({
      resetModalVisible: true,
    });
  }

  @autobind
  closeResetModal(): void {
    this.setState({
      resetModalVisible: false,
    });
  }

  @autobind
  onDestructiveChangeAcknowledged() {
    const { interimConfiguration } = this.state;

    this.props.onConfigurationUpdated(interimConfiguration);
    this.setState({
      destructiveActionModalVisible: false,
      interimConfiguration: this.emptyConfiguration,
    });
  }

  @autobind
  onDestrucitveChangeCancelled() {
    this.setState({
      destructiveActionModalVisible: false,
      interimConfiguration: this.emptyConfiguration,
    });
  }

  @autobind
  onConfigurationUpdated(configuration: Configuration) {
    const { isDestructiveAction } = this.props;

    if (configuration.value() === this.props.configuration.value()) {
      return;
    }

    if (!isDestructiveAction) {
      this.props.onConfigurationUpdated(configuration);
    } else {
      this.setState({
        interimConfiguration: configuration,
        destructiveActionModalVisible: true,
      });
    }
  }

  @autobind
  onResetConfiguration() {
    const { onResetConfiguration, configuration } = this.props;
    onResetConfiguration(configuration);
  }

  maybeRenderResetModal() {
    const { resetModalVisible } = this.state;
    const { configuration } = this.props;

    if (!resetModalVisible) {
      return null;
    }

    return (
      <ResetConfigurationModal
        onResetAcknowledged={this.onResetConfiguration}
        onResetCancelled={this.closeResetModal}
        configuration={configuration}
        show={resetModalVisible}
      />
    );
  }

  maybeRenderDestructiveActionModal() {
    const { destructiveActionModalVisible } = this.state;
    const { destructiveChangeWarning } = this.props;

    if (!destructiveActionModalVisible) {
      return null;
    }

    return (
      <DestructiveActionModal
        show={destructiveActionModalVisible}
        warningText={destructiveChangeWarning}
        onActionAcknowledged={this.onDestructiveChangeAcknowledged}
        onActionCancelled={this.onDestrucitveChangeCancelled}
      />
    );
  }

  renderControls() {
    return (
      <div className="configuration-tab__controls">
        {this.renderResetButton()}
      </div>
    );
  }

  renderResetButton() {
    return (
      <Button
        className="configuration-tab__button"
        onClick={this.openResetModal}
        intent={Button.Intents.DANGER}
      >
        {TEXT.resetValue}
      </Button>
    );
  }

  render() {
    const { children: child, configuration, configurationTitle } = this.props;
    // The server provides a description (in English). If a localized version
    // of the help text is available, provide it.
    const description: string = HELP_TEXT[configuration.key()]
      ? HELP_TEXT[configuration.key()]
      : configuration.description();
    const updatedChild =
      configuration !== this.emptyConfiguration
        ? React.cloneElement(child, {
            ...child.props,
            onConfigurationUpdated: this.onConfigurationUpdated,
          })
        : null;

    return (
      <Card
        className="configuration-tab__card"
        title={configurationTitle}
        headingBackground="offwhite"
        helpText={description}
      >
        <div className="configuration-tab__row">{updatedChild}</div>
        <div className="configuration-tab__row">{this.renderControls()}</div>
        {this.maybeRenderDestructiveActionModal()}
        {this.maybeRenderResetModal()}
      </Card>
    );
  }
}
