// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';

import I18N from 'lib/I18N';

export default class UnauthorizedPage extends React.Component<{}> {
  static renderToDOM(elementId: string = 'app'): void {
    const container = document.getElementById(elementId);
    if (container) {
      ReactDOM.render(<UnauthorizedPage />, container);
    }
  }

  render(): React.Node {
    return (
      <div className="unauthorized-page min-full-page-height">
        <div className="unauthorized-page__main-container">
          {I18N.text('You are not authorized to perform this action')}
        </div>
      </div>
    );
  }
}
