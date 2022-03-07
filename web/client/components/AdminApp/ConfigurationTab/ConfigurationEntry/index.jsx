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
import { noop } from 'util/util';

const TEXT = t('admin_app.configuration');
const HELP_TEXT = TEXT.helpText;

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
  configuration: Configuration,
  onConfigurationUpdated: (updatedValue: Configuration) => void,
  onResetConfiguration: (configurationToReset: Configuration) => Promise<void>,

  className: string,
  destructiveChangeWarning: string,
  enablePrimaryButton: boolean,
  isDestructiveAction: boolean,
  onPrimaryAction: () => void,
  primaryButtonText: string,
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
    description: '',
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
        interimConfiguration: configuration,
        destructiveActionModalVisible: true,
      });
    }
  }

  @autobind
  onResetConfiguration() {
    const { onResetConfiguration, configuration } = this.props;
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
        onResetAcknowledged={this.onResetConfiguration}
        onResetCancelled={this.closeResetModal}
        configuration={configuration}
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
        show={destructiveActionModalVisible}
        warningText={destructiveChangeWarning}
        onActionAcknowledged={this.onDestructiveChangeAcknowledged}
        onActionCancelled={this.onDestrucitveChangeCancelled}
      />
    );
  }

  maybeRenderResetButton(): React.Node {
    if (this.props.hideResetButton) {
      return null;
    }

    return <ResetButton onClick={this.openResetModal} />;
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
          title={configurationTitle || ''}
          helpText={description}
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
