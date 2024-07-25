// @flow
import * as React from 'react';
import Promise from 'bluebird';

import Button from 'components/ui/Button';
import Configuration from 'services/models/Configuration';
import ConfigurationBlock from 'components/AdminApp/ConfigurationTab/ConfigurationBlock';
import DestructiveActionModal from 'components/common/DestructiveActionModal';
import Group from 'components/ui/Group';
import ResetButton from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/ResetButton';
import ResetConfigurationModal from 'components/AdminApp/ConfigurationTab/ConfigurationEntry/ResetConfigurationModal';
import autobind from 'decorators/autobind';
import { CONFIGURATION_HELP_TEXT } from 'services/ConfigurationService';
import { noop } from 'util/util';

export type ChildProps = {
  configuration: Configuration,
  onConfigurationUpdated: (updatedValue: Configuration) => void,
  testId?: string,
};

type DefaultProps = {
  className: string,
  configurationTitle?: string,
  destructiveChangeWarning: string,
  enablePrimaryButton: boolean,
  hideResetButton: boolean,
  inlineControlButtons: boolean,
  isDestructiveAction: boolean,
  onPrimaryAction: () => void,
  primaryButtonText: string,

  /** Renders this configuration wrapped in a card block */
  useCardWrapper: boolean,
};

type Props = {
  ...DefaultProps,
  children: React.MixedElement,
  className: string,
  configuration: Configuration,
  destructiveChangeWarning: string,
  enablePrimaryButton: boolean,
  isDestructiveAction: boolean,
  onConfigurationUpdated: (updatedValue: Configuration) => void,
  onPrimaryAction: () => void,
  onResetConfiguration: (configurationToReset: Configuration) => Promise<void>,
  primaryButtonText: string,
};

type State = {
  destructiveActionModalVisible: boolean,
  interimConfiguration: Configuration,
  resetModalVisible: boolean,
};

// TODO: This component has a few anti-patterns (modification of child
// props, weird constant requirements) that need to be cleaned up.
export default class ConfigurationEntry extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps: DefaultProps = {
    className: '',
    configurationTitle: undefined,
    destructiveChangeWarning: '',
    enablePrimaryButton: false,
    hideResetButton: false,
    inlineControlButtons: false,
    isDestructiveAction: false,
    onPrimaryAction: noop,
    primaryButtonText: '',
    useCardWrapper: false,
  };

  emptyConfiguration: Configuration = Configuration.create({
    defaultValue: '',
    key: this.props.configuration.key(),
    value: '',
  });

  state: State = {
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
        destructiveActionModalVisible: true,
        interimConfiguration: configuration,
      });
    }
  }

  @autobind
  onResetConfiguration() {
    const { configuration, onResetConfiguration } = this.props;
    onResetConfiguration(configuration).finally(() => this.closeResetModal());
  }

  maybeRenderPrimaryButton(): React.Element<typeof Button> | null {
    const {
      enablePrimaryButton,
      onPrimaryAction,
      primaryButtonText,
    } = this.props;
    return enablePrimaryButton ? (
      <Button
        className="configuration-tab__button"
        onClick={onPrimaryAction}
        outline
      >
        {primaryButtonText}
      </Button>
    ) : null;
  }

  maybeRenderResetModal(): React.Element<
    typeof ResetConfigurationModal,
  > | null {
    const { resetModalVisible } = this.state;
    const { configuration } = this.props;

    if (!resetModalVisible) {
      return null;
    }

    return (
      <ResetConfigurationModal
        configuration={configuration}
        onResetAcknowledged={this.onResetConfiguration}
        onResetCancelled={this.closeResetModal}
        show={resetModalVisible}
      />
    );
  }

  maybeRenderDestructiveActionModal(): React.Element<
    typeof DestructiveActionModal,
  > | null {
    const { destructiveActionModalVisible } = this.state;
    const { destructiveChangeWarning } = this.props;

    if (!destructiveActionModalVisible) {
      return null;
    }

    return (
      <DestructiveActionModal
        onActionAcknowledged={this.onDestructiveChangeAcknowledged}
        onActionCancelled={this.onDestrucitveChangeCancelled}
        show={destructiveActionModalVisible}
        warningText={destructiveChangeWarning}
      />
    );
  }

  maybeRenderResetButton(): React.Node {
    const { configuration } = this.props;
    if (this.props.hideResetButton) {
      return null;
    }

    return (
      <ResetButton
        onClick={this.openResetModal}
        testId={`configuration-${configuration.key()}`}
      />
    );
  }

  renderControls(): React.Node {
    return (
      <div className="configuration-tab__controls">
        {this.maybeRenderPrimaryButton()}
        {this.maybeRenderResetButton()}
      </div>
    );
  }

  render(): React.Node {
    const {
      children: child,
      className,
      configuration,
      configurationTitle,
      inlineControlButtons,
      useCardWrapper,
    } = this.props;
    const description: string = CONFIGURATION_HELP_TEXT[configuration.key()];
    const updatedChild =
      configuration !== this.emptyConfiguration
        ? React.cloneElement(child, {
            ...child.props,
            onConfigurationUpdated: this.onConfigurationUpdated,
          })
        : null;

    const contents = (
      <>
        <Group direction={inlineControlButtons ? 'horizontal' : 'vertical'}>
          {updatedChild}
          <div className="configuration-tab__row">{this.renderControls()}</div>
        </Group>
        {this.maybeRenderDestructiveActionModal()}
        {this.maybeRenderResetModal()}
      </>
    );

    if (useCardWrapper) {
      return (
        <ConfigurationBlock
          className={className}
          helpText={description}
          title={configurationTitle || ''}
        >
          {contents}
        </ConfigurationBlock>
      );
    }

    return (
      <>
        {configurationTitle !== undefined ? <p>{configurationTitle}</p> : null}
        {contents}
      </>
    );
  }
}
