// @flow
import * as React from 'react';
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import QuerySessionService from 'services/QuerySessionService';
import QueryTabItem from 'models/AdvancedQueryApp/QueryTabItem';
import notifyError from 'components/AdvancedQueryApp/notifyError';
import { SESSION_SOURCES } from 'models/AdvancedQueryApp/QuerySession';
import type QuerySession from 'models/AdvancedQueryApp/QuerySession';

const TEXT_PATH = 'AdvancedQueryApp';
const TEXT = t(TEXT_PATH);

function getURLQueryId(): string | void {
  // The Query ID is stored as a param in the URL hash. If the URL does not
  // match our expected format (essentially one hash param) then we cannot
  // load the stored session. If no session exists, return undefined.
  return window.location.hash.split('#h=')[1];
}

function removeHashFromURL() {
  window.history.replaceState(null, '', ' ');
}

/**
 * Generate a new tab name for a given query session. The tab name
 * is of the form 'Copy from someuser@zenysis.com'. In case of duplciate
 * names we insert an index, e.g. 'Copy 2 from someuser@zenysis.com'
 */
function generateNewTabName(
  querySession: QuerySession,
  tabList: Zen.Array<QueryTabItem>,
): string {
  const allTabNames = new Set(tabList.map(tab => tab.name()));
  let tabName = t('copiedQueryTabName', {
    scope: TEXT_PATH,
    username: querySession.username(),
  });
  let copyCount = 1;
  while (allTabNames.has(tabName)) {
    copyCount += 1;
    tabName = t('copiedQueryTabNameWithCount', {
      scope: TEXT_PATH,
      num: copyCount,
      username: querySession.username(),
    });
  }
  return tabName;
}

/**
 * Custom hook that returns a function that can be used to load a QueryTabItem
 * from the hash in the current URL. If no hash exists, the promise will return
 * undefined.
 */
export default function useLoadQueryFromURLHash(
  getQuerySession: typeof QuerySessionService.getQuerySession,
): (currentTabList: Zen.Array<QueryTabItem>) => Promise<QueryTabItem | void> {
  // fetch a saved query from the server using the query ID stored in the URL
  // hash
  return React.useCallback(
    (currentTabList: Zen.Array<QueryTabItem>) => {
      // If the user navigated to the page via a query sharing URL, restore that
      // query data on top of the stored session data.
      const serverSessionId = getURLQueryId();

      // Hash is never needed after initial usage so it is removed.
      removeHashFromURL();

      // return undefined if no hash exists
      if (serverSessionId === undefined) {
        return Promise.resolve(undefined);
      }

      return getQuerySession(serverSessionId)
        .then((querySession: QuerySession) => {
          const newTab = QueryTabItem.createWithUniqueId({
            queryResultSpec: querySession.queryResultSpec(),
            querySelections: querySession.querySelections(),
            viewType: querySession.viewType(),
            visualizationType: querySession.visualizationType(),
          });

          if (querySession.sourceType() === SESSION_SOURCES.SHARED) {
            const tabName = generateNewTabName(querySession, currentTabList);
            return newTab.name(tabName);
          }

          return newTab;
        })
        .catch(e => {
          // TODO(toshi): Consider removing this entry from DB
          notifyError(TEXT.errorFetchingSharedQuery, e);
        });
    },
    [getQuerySession],
  );
}
