// @flow
import * as React from 'react';

import AlertMessage, { ALERT_TYPE } from 'components/common/AlertMessage';
import BaseModal from 'components/ui/BaseModal';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import Intents from 'components/ui/LegacyIntents';
import LegacyButton from 'components/ui/LegacyButton';
import { areStringsEqualIgnoreCase } from 'util/stringUtil';
import { autobind, memoizeOne } from 'decorators';

type BaseModalProps = $Diff<
  React.ElementConfig<typeof BaseModal>,
  {
    customFooter: mixed,
    onRequestClose: mixed,
  },
>;

type DefaultProps = {
  // The text that the user has to type into the modal to acknowledge that
  // they want to proceed with the request.
  acknowledgeText: string,

  // The text that will be shown on the `cancel` button.
  cancelText: string,

  // The initial value of the text input block.
  initialInputValue: string,

  // The text that will be shown on the `proceed` button.
  proceedText: string,

  showCloseButton: boolean,
  showPrimaryButton: boolean,
  showSecondaryButton: boolean,
  title: string,
};

type Props = {
  ...BaseModalProps,
  ...DefaultProps,

  // The callback that is invoked when the destructive action is affirmatively
  // acknowledged by the user.
  onActionAcknowledged: () => void,

  // The callback that is invoked when the destructive action is not
  // acknowledged by the user. This will also be triggered if the user closes
  // the modal.
  onActionCancelled: () => void,

  // The warning text that will be displayed to the user advising them not
  // to proceed with an action unless they understand the consequences.
  warningText: string,
};

type State = {
  actionAcknowledged: boolean,
};

/**
  DestructiveActionModal is used in scenarios where explicit user confirmation
  is required before undertaking a potentially destructive action
  (e.g. allowing unregistered users to access the site or deleting a list of
  all the users from the database)

  Example usage:
    <DestructiveActionModal
      show={this.state.modalVisible}
      warningText={I18N.text("Public Access Warning")}
      onActionAcknowledged={this.onPublicAccessChanged}
    />
*/
export default class DestructiveActionModal extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps: DefaultProps = {
    acknowledgeText: I18N.text('I understand'),
    cancelText: I18N.textById('Cancel'),
    initialInputValue: '',
    proceedText: I18N.text('Proceed'),
    showCloseButton: false,
    showPrimaryButton: false,
    showSecondaryButton: false,
    title: I18N.text('Confirmation Required'),
  };

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      actionAcknowledged: areStringsEqualIgnoreCase(
        props.initialInputValue,
        props.acknowledgeText,
      ),
    };
  }

  @memoizeOne
  computeInstructionText(acknowledgeText: string): string {
    return I18N.text(
      "To undertake this action, please type '%(acknowledgeText)s' to acknowledge that you understand.",
      'instructionFormat',
      {
        acknowledgeText,
      },
    );
  }

  @autobind
  onTextEntered(text: string) {
    const actionAcknowledged = areStringsEqualIgnoreCase(
      text,
      this.props.acknowledgeText,
    );

    this.setState({ actionAcknowledged });
  }

  @autobind
  onActionAcknowledged() {
    this.props.onActionAcknowledged();
    // Reset the component's state
    this.setState({ actionAcknowledged: false });
  }

  renderWarningControl(): React.Node {
    return (
      <div className="destructive-modal-body">
        <AlertMessage type={ALERT_TYPE.ERROR}>
          {this.props.warningText}
        </AlertMessage>
        <div className="destructive-modal-instruction-text">
          {this.computeInstructionText(this.props.acknowledgeText)}
        </div>
        <InputText.Uncontrolled
          initialValue={this.props.initialInputValue}
          onChange={this.onTextEntered}
          testId="destructive-action-confirmation"
        />
      </div>
    );
  }

  renderActionButtons(): React.Node {
    return (
      <div className="destructive-modal-actions row">
        <div className="col-md-6">
          <div className="pull-left">{this.renderCancelButton()}</div>
        </div>
        <div className="col-md-6">
          <div className="pull-right">{this.renderProceedButton()}</div>
        </div>
      </div>
    );
  }

  renderProceedButton(): React.Node {
    return (
      <LegacyButton
        disabled={!this.state.actionAcknowledged}
        onClick={this.onActionAcknowledged}
        testId="destructive-action-confirm"
        type={Intents.WARNING}
      >
        {this.props.proceedText}
      </LegacyButton>
    );
  }

  renderCancelButton(): React.Node {
    return (
      <LegacyButton
        onClick={this.props.onActionCancelled}
        testId="destructive-action-cancel"
        type={Intents.SUCCESS}
      >
        {this.props.cancelText}
      </LegacyButton>
    );
  }

  render(): React.Element<typeof BaseModal> {
    const {
      acknowledgeText,
      cancelText,
      initialInputValue,
      onActionAcknowledged,
      onActionCancelled,
      proceedText,
      warningText,
      ...passThroughProps
    } = this.props;
    return (
      <BaseModal
        customFooter={this.renderActionButtons()}
        onRequestClose={onActionCancelled}
        {...passThroughProps}
      >
        {this.renderWarningControl()}
      </BaseModal>
    );
  }
}
