// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';

import I18N from 'lib/I18N';
import { localizeUrl } from 'components/Navbar/util';

export default class NotFoundPage extends React.Component<{}> {
  static renderToDOM(elementId: string = 'app'): void {
    const container = document.getElementById(elementId);
    if (container) {
      ReactDOM.render(<NotFoundPage />, container);
    }
  }

  mayRenderAdminHint(): React.Node {
    const { isAdmin, isAuthenticated } = window.__JSON_FROM_BACKEND.user;
    if (isAdmin && isAuthenticated) {
      return (
        <li>
          {`${I18N.text(
            'A correct default url is set in the Site Configuration tab of the',
          )} `}
          <a href={localizeUrl('/admin')}>{I18N.textById('Settings')}</a>
        </li>
      );
    }
    return null;
  }

  renderInstructions(): React.Node {
    return (
      <ol className="notfound-page__hints">
        <li>{I18N.text('Make sure that you typed the url correctly')}</li>
        {this.mayRenderAdminHint()}
        <li>
          {`${I18N.text('Try visiting the ')} `}
          <a href={localizeUrl('/')}>{I18N.text('Homepage')}</a>
        </li>
      </ol>
    );
  }

  render(): React.Node {
    return (
      <div className="notfound-page min-full-page-height">
        <div className="notfound-page__main-container">
          <div className="notfound-page__content-title">
            {I18N.text('The page you are trying to access does not exist')}
          </div>
          {this.renderInstructions()}
        </div>
      </div>
    );
  }
}
