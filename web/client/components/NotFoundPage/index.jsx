// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';

import { localizeUrl } from 'components/Navbar/util';

const TEXT = t('NotFoundPage');

export default class NotFoundPage extends React.Component<{}> {
  static renderToDOM(elementId: string = 'app'): void {
    const container = document.getElementById(elementId);
    if (container) {
      ReactDOM.render(<NotFoundPage />, container);
    }
  }

  mayRenderAdminHint() {
    const { isAdmin, isAuthenticated } = window.__JSON_FROM_BACKEND.user;
    if (isAdmin && isAuthenticated) {
      return (
        <li>
          {`${TEXT.defaultUrlHint} `}
          <a href={localizeUrl('/admin')}>{TEXT.urlSettingsLinkText}</a>
        </li>
      );
    }
    return null;
  }

  renderInstructions() {
    return (
      <ol className="notfound-page__hints">
        <li>{TEXT.correctUrlHint}</li>
        {this.mayRenderAdminHint()}
        <li>
          {`${TEXT.goHomeHint} `}
          <a href={localizeUrl('/')}>{TEXT.homeLinkText}</a>
        </li>
      </ol>
    );
  }

  render() {
    return (
      <div className="notfound-page min-full-page-height">
        <div className="notfound-page__main-container">
          <div className="notfound-page__content-title">{TEXT.mainText}</div>
          {this.renderInstructions()}
        </div>
      </div>
    );
  }
}
