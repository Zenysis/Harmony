// @flow
/* eslint-disable react/no-danger */
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import autobind from 'decorators/autobind';

type DefaultProps = {
  // Number of days before showing disclaimer again
  expirationDays: number,

  // Whether to show by default.
  showInitial: boolean,
};

type Props = {
  ...DefaultProps,
  cookiePrefix: string,
  disclaimerHtml: string,
  title: string,
};

type State = {
  show: boolean,
};

export default class Disclaimer extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    expirationDays: 7,
    showInitial: false,
  };

  state: State = {
    show: this.hasUserAccepted() ? false : this.props.showInitial,
  };

  getCookieName(): string {
    return `zenDisclaimer__${this.props.cookiePrefix}`;
  }

  hasUserAccepted(): boolean {
    return (
      document.cookie
        .split(';')
        .filter(item => item.includes(`${this.getCookieName()}=1`)).length > 0
    );
  }

  setCookie() {
    const expirationSec = this.props.expirationDays * 86400;
    // The user has accepted, record the cookie.
    document.cookie = `${this.getCookieName()}=1;max-age=${expirationSec}`;
  }

  @autobind
  onClose() {
    // Closed without accepting terms.
    const { disclaimerHtml, title } = this.props;
  }

  @autobind
  onAccept() {
    // Accepted disclaimer.
    this.setCookie();

    const { disclaimerHtml, title } = this.props;

    this.setState({
      show: false,
    });
  }

  render(): React.Node {
    const { show } = this.state;
    if (!show) {
      return null;
    }

    const { disclaimerHtml, title } = this.props;
    return (
      <BaseModal
        onPrimaryAction={this.onAccept}
        onRequestClose={this.onClose}
        primaryButtonText="Accept"
        show={show}
        showPrimaryButton
        title={title}
      >
        <span dangerouslySetInnerHTML={{ __html: disclaimerHtml }} />
      </BaseModal>
    );
  }
}
