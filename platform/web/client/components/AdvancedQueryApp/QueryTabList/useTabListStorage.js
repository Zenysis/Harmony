// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import BrowserSessionService from 'services/SessionSyncService';
import I18N from 'lib/I18N';
import QueryTabItem from 'models/AdvancedQueryApp/QueryTabItem';
import notifyError from 'components/AdvancedQueryApp/notifyError';
import useDebouncedCallback from 'lib/hooks/useDebouncedCallback';

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
  loadQueryTabFromURL: (
    currentTabList: Zen.Array<QueryTabItem>,
  ) => Promise<QueryTabItem | void>,
  username: string,
  currentTabIdx: number,
  tabList: Zen.Array<QueryTabItem>,
): [LoadTabListFn, SaveTabListFn] {
  const saveTabsToBrowserStore = useDebouncedCallback(
    () =>
      BrowserSessionService.putData({
        currentTabIdx,
        username,
        tabList: Zen.serializeArray(tabList),
      }),
    500,
    [username, tabList, currentTabIdx],
  );

  const loadTabsFromBrowserStore = () => {
    let browserData;
    return BrowserSessionService.getData(username)
      .then(data => {
        browserData = data || { currentTabIdx: 0, tabList: [] };

        // Deserialize all stored queries into the full QueryTabItem.
        const tabPromises = browserData.tabList.map(serializedQueryTabItem =>
          QueryTabItem.deserializeAsync(serializedQueryTabItem).catch(e => {
            const tabName =
              serializedQueryTabItem.name || I18N.text('Tab Error');
            notifyError(`${I18N.text('Problem loading query')}: ${tabName}`, e);
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
        notifyError(
          I18N.text(
            'Problem loading all queries. Resetting tabs',
            'problemLoadingQueries',
          ),
          e,
        );
        BrowserSessionService.deleteData(username);
      });
  };

  return [loadTabsFromBrowserStore, saveTabsToBrowserStore];
}
