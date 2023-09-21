// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';
import { RelayEnvironmentProvider } from 'react-relay/hooks';

import AuthorizationService from 'services/AuthorizationService';
import DataStatusPage from 'components/DataUploadApp/DataStatusPage';
import DataStatusPageFallback from 'components/DataUploadApp/DataStatusPageFallback';
import {
  SITE_PERMISSIONS,
  RESOURCE_TYPES,
} from 'services/AuthorizationService/registry';
import { cancelPromise } from 'util/promiseUtil';
import { environment } from 'util/graphql';

export function renderToDOM(elementId: string = 'app'): void {
  const elt: ?HTMLElement = document.getElementById(elementId);
  invariant(elt, `Element ID does not exist: ${elementId}`);
  ReactDOM.render(<DataUploadApp />, elt);
}

export default function DataUploadApp(): React.Node {
  const [isSelfServeAdmin, setIsSelfServeAdmin] = React.useState<boolean>(
    false,
  );

  React.useEffect(() => {
    const promise = AuthorizationService.isAuthorized(
      SITE_PERMISSIONS.SELFSERVE_SOURCE_ADMIN,
      RESOURCE_TYPES.SITE,
    ).then(isAuthorized => {
      setIsSelfServeAdmin(isAuthorized);
    });
    return () => cancelPromise(promise);
  }, []);

  const { deploymentName } = window.__JSON_FROM_BACKEND;

  return (
    <RelayEnvironmentProvider environment={environment}>
      <React.Suspense
        fallback={
          <DataStatusPageFallback isSelfServeAdmin={isSelfServeAdmin} />
        }
      >
        <DataStatusPage isSelfServeAdmin={isSelfServeAdmin} />
      </React.Suspense>
    </RelayEnvironmentProvider>
  );
}
