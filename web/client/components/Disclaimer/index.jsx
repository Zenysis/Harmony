// @flow
/* eslint-disable react/no-danger */
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import autobind from 'decorators/autobind';

type DefaultProps = {
  // Whether to show by default.
  showInitial: boolean,

  // Number of days before showing disclaimer again
  expirationDays: number,
};

type Props = {
  ...DefaultProps,
  title: string,
  disclaimerHtml: string,
  cookiePrefix: string,
};

type State = {
  show: boolean,
};

export default class Disclaimer extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    showInitial: false,
    expirationDays: 7,
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
    const { title, disclaimerHtml } = this.props;
    analytics.track(
      'Disclaimer rejected',
      {
        title,
        disclaimerHtml,
      },
      undefined,
      () => {
        window.location.href = '/';
      },
    );
  }

  @autobind
  onAccept() {
    // Accepted disclaimer.
    this.setCookie();

    const { title, disclaimerHtml } = this.props;
    analytics.track('Disclaimer accepted', {
      title,
      disclaimerHtml,
    });

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
        title={title}
        show={show}
        onRequestClose={this.onClose}
        onPrimaryAction={this.onAccept}
        primaryButtonText="Accept"
        showPrimaryButton
      >
        <span dangerouslySetInnerHTML={{ __html: disclaimerHtml }} />
      </BaseModal>
    );
  }
}
