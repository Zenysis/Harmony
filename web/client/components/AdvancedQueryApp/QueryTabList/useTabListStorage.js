// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import BrowserSessionService from 'services/SessionSyncService';
import QueryTabItem from 'models/AdvancedQueryApp/QueryTabItem';
import notifyError from 'components/AdvancedQueryApp/notifyError';
import useDebouncedCallback from 'lib/hooks/useDebouncedCallback';

const TEXT = t('AdvancedQueryApp');

type LoadTabListFn = () => Promise<{
  currentTabIdx: number,
  tabList: $ReadOnlyArray<QueryTabItem>,
}>;
type SaveTabListFn = () => Promise<void>;

/**
 * Custom hook that supports persistence of our tab list in the browser. It
 * returns two functions:
 * 1. A function that loads a tab list from the browser store
 * 2. A function that saves a tab list back to the browser store
 */
export default function useTabListStorage(
  browserSessionService: typeof BrowserSessionService,
  loadQueryTabFromURL: (
    currentTabList: Zen.Array<QueryTabItem>,
  ) => Promise<QueryTabItem | void>,
  username: string,
  currentTabIdx: number,
  tabList: Zen.Array<QueryTabItem>,
): [LoadTabListFn, SaveTabListFn] {
  const saveTabsToBrowserStore = useDebouncedCallback(
    () =>
      browserSessionService.putData({
        username,
        currentTabIdx,
        tabList: Zen.serializeArray(tabList),
      }),
    500,
    [browserSessionService, username, tabList, currentTabIdx],
  );

  const loadTabsFromBrowserStore = () => {
    let browserData;
    return browserSessionService
      .getData(username)
      .then(data => {
        browserData = data || { currentTabIdx: 0, tabList: [] };

        // Deserialize all stored queries into the full QueryTabItem.
        const tabPromises = browserData.tabList.map(serializedQueryTabItem =>
          QueryTabItem.deserializeAsync(serializedQueryTabItem).catch(e => {
            analytics.track('Problem with deserializing stored query', {
              serializedTab: JSON.stringify(serializedQueryTabItem),
            });
            const tabName = serializedQueryTabItem.name || TEXT.tabNameNotFound;
            notifyError(`${TEXT.queryDeserializationError}: ${tabName}`, e);
            return QueryTabItem.createWithUniqueId({ name: tabName });
          }),
        );

        return Promise.all(tabPromises);
      })
      .then(deserializedTabs =>
        loadQueryTabFromURL(deserializedTabs).then(queryFromURLHash => {
          const fullTabList = [...deserializedTabs];
          let selectedTabIdx = browserData.currentTabIdx;

          // If the user navigated to AQT using a shareable query URL, add the
          // restored query tab item to the end of the list and make it the
          // currently visible tab.
          if (queryFromURLHash !== undefined) {
            fullTabList.push(queryFromURLHash);
            selectedTabIdx = fullTabList.length - 1;
          }
          return { currentTabIdx: selectedTabIdx, tabList: fullTabList };
        }),
      )
      .catch(e => {
        analytics.track('Problem with deserializing all queries', {
          event: e.toString(),
        });
        notifyError(TEXT.allQueriesDeserializationError, e);
        browserSessionService.deleteData(username);
      });
  };

  return [loadTabsFromBrowserStore, saveTabsToBrowserStore];
}
