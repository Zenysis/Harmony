// @flow
import React from 'react';

import Button from 'components/ui/Button';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import autobind from 'decorators/autobind';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import type { InviteeRequest } from 'services/DirectoryService';

const NAME_PATTERN = '(^[A-zÀ-ÿ0-9]+[A-zÀ-ÿ0-9-_ ]*[A-zÀ-ÿ0-9]+)$';
const NAME_REGEX = RegExp(NAME_PATTERN);

const EMAIL_PATTERN = '(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$)';
const EMAIL_REGEX = RegExp(EMAIL_PATTERN);

const TEXT = t('admin_app.inviteUserBlock');

type Props = {
  /**
   * A callback that is invoked when the user wishes to invite a new user.
   *
   * @param {InviteeRequest} invitee The details of the user to be invited.
   */
  onSendInviteRequested: (invitee: InviteeRequest) => void,
};

type State = {
  inputEmailValue: string,
  inputNameValue: string,
  sendingEmails: boolean,
};

class InviteUserBlock extends React.PureComponent<Props, State> {
  state = {
    sendingEmails: false,
    inputEmailValue: '',
    inputNameValue: '',
  };

  getInviteButtonText() {
    if (this.state.sendingEmails) {
      return TEXT.inviteSendingInProgress;
    }
    return TEXT.inviteUserButton;
  }

  inviteButtonDisabled(): boolean {
    return this.state.sendingEmails || !this.inputsAreValid();
  }

  inputsAreValid(): boolean {
    const { inputEmailValue, inputNameValue } = this.state;

    return NAME_REGEX.test(inputNameValue) && EMAIL_REGEX.test(inputEmailValue);
  }

  @autobind
  onEmailInputChange(val) {
    this.setState({ inputEmailValue: val });
  }

  @autobind
  onNameInputChange(val) {
    this.setState({ inputNameValue: val });
  }

  @autobind
  onSendInviteRequested() {
    const request: InviteeRequest = {
      name: this.state.inputNameValue,
      email: this.state.inputEmailValue,
    };
    this.props.onSendInviteRequested(request);
  }

  render() {
    return (
      <div className="invite-user-block">
        <LabelWrapper boldLabel inline label={TEXT.inviteUser}>
          <InputText
            value={this.state.inputNameValue}
            onChange={this.onNameInputChange}
            onEnterPress={this.onSendInviteRequested}
            placeholder={TEXT.namePlaceholder}
            width="auto"
          />
          <InputText
            type="email"
            value={this.state.inputEmailValue}
            onChange={this.onEmailInputChange}
            onEnterPress={this.onSendInviteRequested}
            placeholder={TEXT.emailPlaceholder}
            width="auto"
          />
          <Button
            disabled={this.inviteButtonDisabled()}
            onClick={this.onSendInviteRequested}
          >
            {this.getInviteButtonText()}
          </Button>
        </LabelWrapper>
      </div>
    );
  }
}

export default withScriptLoader(InviteUserBlock, VENDOR_SCRIPTS.toastr);
