// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';
import { RelayEnvironmentProvider } from 'react-relay/hooks';

import FieldSetupPage from 'components/FieldSetupApp/FieldSetupPage';
import { environment } from 'util/graphql';

export default class FieldSetupApp extends React.Component<{}> {
  static renderToDOM(elementId?: string = 'app'): void {
    const elt: ?HTMLElement = document.getElementById(elementId);
    invariant(elt, `Element ID does not exist: ${elementId}`);
    ReactDOM.render(<FieldSetupApp />, elt);
  }

  render(): React.Node {
    // NOTE: Only render for dev. This is a incomplete feature. Use at
    // your own risk.
    if (!__DEV__) {
      return null;
    }

    return (
      <RelayEnvironmentProvider environment={environment}>
        <div className="field-setup min-full-page-height">
          <FieldSetupPage />
        </div>
      </RelayEnvironmentProvider>
    );
  }
}
