import React from 'react';
import ReactDOM from 'react-dom';

import BaseModal from 'components/ui/BaseModal';
import LegacyButton from 'components/ui/LegacyButton';
import { getQueryParam } from 'util/util';

const REGISTRATION_URL = window.__JSON_FROM_BACKEND.ui.feedbackRegistration;

function openRegistrationForm() {
  window.location.href = REGISTRATION_URL;
}

export default class NewUserButton extends React.PureComponent {
  static renderToDOM(elementId = 'app') {
    ReactDOM.render(<NewUserButton />, document.getElementById(elementId));
  }

  constructor(props) {
    super(props);
    this.state = {
      showRegistrationModal: false,
    };

    this.openRegistrationModal = this.changeRegistrationModalVisibility.bind(
      this,
      true,
    );
    this.closeRegistrationModal = this.changeRegistrationModalVisibility.bind(
      this,
      false,
    );
  }

  changeRegistrationModalVisibility(showRegistrationModal) {
    this.setState({ showRegistrationModal });
  }

  getFooterButtons() {
    return (
      <div className="row">
        <div className="col-xs-12">
          <div className="pull-left">
            <LegacyButton type="primary" onClick={openRegistrationForm}>
              {t('login.continue_btn')}
            </LegacyButton>
            &nbsp;
            <LegacyButton onClick={this.closeRegistrationModal}>
              {t('login.cancel_btn')}
            </LegacyButton>
          </div>
        </div>
      </div>
    );
  }

  maybeRenderRegistrationModal() {
    if (this.state.showRegistrationModal) {
      return (
        <BaseModal
          onRequestClose={this.closeRegistrationModal}
          show={this.state.showRegistrationModal}
          title={t('login.modal_title')}
          width={350}
          customFooter={this.getFooterButtons()}
        >
          <div className="filter-slice-modal">
            <div className="filter-slice-modal-header">
              <h4>
                {t('login.content_l1')}
                <br />
                <br />
                {t('login.content_l2')}
                <br />
                {t('login.content_l3')}
              </h4>
            </div>
          </div>
        </BaseModal>
      );
    }
    return null;
  }

  maybeRenderRegistrationButton() {
    const param = getQueryParam('timeout');
    if (REGISTRATION_URL && !param) {
      return (
        <LegacyButton
          className="new-user-button"
          onClick={this.openRegistrationModal}
          type="success"
        >
          {t('login.registration_title')}
        </LegacyButton>
      );
    }
    return null;
  }

  render() {
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
