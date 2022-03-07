// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';
import { RelayEnvironmentProvider } from 'react-relay/hooks';

import DirectoryPage from 'components/DataCatalogApp/DirectoryPage';
import FieldDetailsPage from 'components/DataCatalogApp/FieldDetailsPage';
import { ENABLED_DATA_CATALOG_APP } from 'components/DataCatalogApp/flags';
import { environment } from 'util/graphql';

const SELECTED_FIELD = window.__JSON_FROM_BACKEND.data_catalog.field_id;

type Props = {};

export default class DataCatalogApp extends React.PureComponent<Props> {
  static renderToDOM(elementId?: string = 'app'): void {
    const elt: ?HTMLElement = document.getElementById(elementId);
    invariant(elt, `Element ID does not exist: ${elementId}`);
    ReactDOM.render(<DataCatalogApp />, elt);
  }

  render(): React.Node {
    // NOTE (solo, stephen, yitian): Enable data catalog only for zenysis users
    if (!ENABLED_DATA_CATALOG_APP) {
      return null;
    }

    const contents =
      SELECTED_FIELD === '' ? (
        <DirectoryPage />
      ) : (
        <FieldDetailsPage fieldId={SELECTED_FIELD} />
      );
    return (
      <RelayEnvironmentProvider environment={environment}>
        <div className="data-catalog min-full-page-height">
          <React.Suspense fallback="Loading...">{contents}</React.Suspense>
        </div>
      </RelayEnvironmentProvider>
    );
  }
}
