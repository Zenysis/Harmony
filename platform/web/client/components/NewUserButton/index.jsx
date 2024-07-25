// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';

import BaseModal from 'components/ui/BaseModal';
import I18N from 'lib/I18N';
import LegacyButton from 'components/ui/LegacyButton';
import autobind from 'decorators/autobind';
import { getQueryParam } from 'util/util';

const REGISTRATION_URL = window.__JSON_FROM_BACKEND.ui.feedbackRegistration;

function openRegistrationForm(): void {
  window.location.href = REGISTRATION_URL;
}

type State = {
  showRegistrationModal: boolean,
};

export default class NewUserButton extends React.PureComponent<{}, State> {
  static renderToDOM(elementId?: string = 'app') {
    const elt: ?HTMLElement = document.getElementById(elementId);
    invariant(elt, `Element ID does not exist: ${elementId}`);
    ReactDOM.render(<NewUserButton />, elt);
  }

  state: State = {
    showRegistrationModal: false,
  };

  @autobind
  openRegistrationModal() {
    this.setState({ showRegistrationModal: true });
  }

  @autobind
  closeRegistrationModal() {
    this.setState({ showRegistrationModal: false });
  }

  getFooterButtons(): React.Element<'div'> {
    return (
      <div className="row">
        <div className="col-xs-12">
          <div className="pull-left">
            <LegacyButton onClick={openRegistrationForm} type="primary">
              <I18N.Ref id="Continue" />
            </LegacyButton>
            &nbsp;
            <LegacyButton onClick={this.closeRegistrationModal}>
              <I18N.Ref id="Cancel" />
            </LegacyButton>
          </div>
        </div>
      </div>
    );
  }

  maybeRenderRegistrationModal(): React.Node {
    if (this.state.showRegistrationModal) {
      return (
        <BaseModal
          customFooter={this.getFooterButtons()}
          onRequestClose={this.closeRegistrationModal}
          show={this.state.showRegistrationModal}
          title={I18N.text('Note')}
          width={350}
        >
          <div className="filter-slice-modal">
            <div className="filter-slice-modal-header">
              <h4>
                <I18N id="loginContentL1">
                  To submit feedback about EHDAP or request an account for
                  access, please click Continue below.
                </I18N>
                <br />
                <br />
                <I18N id="loginContentL2">
                  Note that at this time accounts are only being granted to the
                  users as per the ministry&apos;s approval.
                </I18N>
                <br />
                <I18N id="loginContentL3">
                  Please make sure that you get the approval from the ministry
                  before you submit a request.
                </I18N>
              </h4>
            </div>
          </div>
        </BaseModal>
      );
    }
    return null;
  }

  maybeRenderRegistrationButton(): React.Node {
    const param = getQueryParam('timeout');
    if (REGISTRATION_URL && !param) {
      return (
        <LegacyButton
          className="new-user-button"
          onClick={this.openRegistrationModal}
          type="success"
        >
          <I18N>Request Access</I18N>
        </LegacyButton>
      );
    }
    return null;
  }

  render(): React.Node {
    return (
      <div className="row">
        <div className="container col-sm-12">
          <div
            className="col-xs-10 col-xs-offset-1 col-sm-8
            col-sm-offset-2 col-md-6 col-md-offset-3 col-lg-4 col-lg-offset-4"
          >
            {this.maybeRenderRegistrationButton()}
          </div>
          {this.maybeRenderRegistrationModal()}
        </div>
      </div>
    );
  }
}
