// @flow
import * as React from 'react';
import classNames from 'classnames';

import * as Zen from 'lib/Zen';
import AQTDispatch, {
  AQTStatuses,
} from 'components/AdvancedQueryApp/AQTDispatch';
import BrowserSessionService from 'services/SessionSyncService';
import DirectoryService from 'services/DirectoryService';
import Icon from 'components/ui/Icon';
import QuerySessionService from 'services/QuerySessionService';
import QueryTab from 'components/AdvancedQueryApp/QueryTabList/QueryTab';
import QueryTabItem from 'models/AdvancedQueryApp/QueryTabItem';
import QueryTabOverview from 'components/AdvancedQueryApp/QueryTabList/QueryTabOverview';
import useBoolean from 'lib/hooks/useBoolean';
import useLoadQueryFromURLHash from 'components/AdvancedQueryApp/QueryTabList/useLoadQueryFromURLHash';
import usePrevious from 'lib/hooks/usePrevious';
import useScrollQueryTabList from 'components/AdvancedQueryApp/QueryTabList/useScrollQueryTabList';
import useTabListStorage from 'components/AdvancedQueryApp/QueryTabList/useTabListStorage';
import type { AQTStatus } from 'components/AdvancedQueryApp/AQTDispatch';

type Props = {
  activeTabIdx: number,
  status: AQTStatus,
  tabList: Zen.Array<QueryTabItem>,

  browserSessionService?: typeof BrowserSessionService,

  /**
   * A function to retrieve a query session given a session id. We use this to
   * load a query from a URL hash.
   */
  getQuerySession?: typeof QuerySessionService.getQuerySession,

  /** The username of whoever is logged in */
  username?: string,
};

const TEXT = t('AdvancedQueryApp.QueryTabList');

// HACK(stephen): Feature flag to disable the tab overview page until we are
// ready for users to see it.
const ENABLE_TAB_OVERVIEW_PAGE = true;

// Build a unique name for a cloned tab. If the same item is cloned multiple
// times without the cloned tabs ever being renamed, we will need to increase a
// sequence number to distinguish these cloned tabs from each other.
function createClonedItemName(
  originalName: string,
  tabList: Zen.Array<QueryTabItem>,
): string {
  const defaultName = `Copy of ${originalName}`;
  let maxSequence;
  tabList.forEach((item: QueryTabItem) => {
    const name = item.name();
    if (name.startsWith(defaultName)) {
      // Split off the sequence number from the end of the string.
      const idx = name.lastIndexOf(' ');
      const sequenceNumber =
        name === defaultName || idx < 0
          ? 0
          : Number(name.substr(idx + 1)) || -1;

      if (maxSequence === undefined || sequenceNumber > maxSequence) {
        maxSequence = sequenceNumber;
      }
    }
  });

  if (maxSequence === undefined) {
    return defaultName;
  }

  return `${defaultName} - ${maxSequence + 1}`;
}

function QueryTabList({
  activeTabIdx,
  status,
  tabList,
  browserSessionService = BrowserSessionService,
  getQuerySession = QuerySessionService.getQuerySession,
  username = DirectoryService.getActiveUsername(),
}: Props) {
  const dispatch = React.useContext(AQTDispatch);
  const prevTabList = usePrevious(tabList);
  const queryTabList = React.useRef(null);
  const tabListActionButtons = React.useRef(null);
  const [isOverviewOpen, openOverview, closeOverview] = useBoolean(false);
  const [
    showScrollButtons,
    isLeftScrollButtonActive,
    isRightScrollButtonActive,
    updateActiveScrollButtons,
    scrollQueryTabList,
    scrollToTab,
  ] = useScrollQueryTabList(
    queryTabList,
    tabList,
    tabListActionButtons,
    prevTabList,
  );

  const loadQueryTabFromURL = useLoadQueryFromURLHash(getQuerySession);
  const prevActiveTab = usePrevious(activeTabIdx);
  const [loadTabListFromBrowser, saveTabsToBrowserStore] = useTabListStorage(
    browserSessionService,
    loadQueryTabFromURL,
    username,
    activeTabIdx,
    tabList,
  );

  const allowTabDeletion = tabList.size() > 1;

  // load the initial tabs (only happens once on component mount)
  React.useEffect(() => {
    loadTabListFromBrowser().then(loadedTabs => {
      const tabsAlreadyExist = loadedTabs.tabList.length > 0;
      const initialTabIdx = tabsAlreadyExist
        ? loadedTabs.currentTabIdx
        : activeTabIdx;
      const initialTabs = tabsAlreadyExist
        ? Zen.Array.create(loadedTabs.tabList)
        : tabList;

      dispatch({
        type: 'TAB_LIST_LOAD',
        currentTabIdx: initialTabIdx,
        tabList: initialTabs,
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Capture URL hash change events so that we can load the query into the
  // user's local session
  React.useEffect(() => {
    const onHashChange = () => {
      loadQueryTabFromURL(tabList).then(serverQueryTabItem => {
        if (serverQueryTabItem !== undefined) {
          dispatch({
            newTab: serverQueryTabItem,
            type: 'NEW_TAB_ADD',
          });
        }
      });
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [loadQueryTabFromURL, dispatch, tabList]);

  // Whenever the tab list changes we should write the tabs back to the
  // browser store (exception: if we haven't finished loading tabs)
  React.useEffect(() => {
    if (status === AQTStatuses.LOADING_TABS) {
      return;
    }

    if (
      (prevTabList !== undefined && tabList !== prevTabList) ||
      (prevActiveTab !== undefined && prevActiveTab !== activeTabIdx)
    ) {
      saveTabsToBrowserStore();
    }
  }, [
    saveTabsToBrowserStore,
    status,
    tabList,
    prevTabList,
    activeTabIdx,
    prevActiveTab,
  ]);

  const onTabListChange = React.useCallback(
    (newTabList: Zen.Array<QueryTabItem>, newTabIdx?: number) =>
      dispatch({
        type: 'TAB_LIST_CHANGE',
        tabList: newTabList,
        newTabIdx,
      }),
    [dispatch],
  );

  const insertTabItem = React.useCallback(
    (item: QueryTabItem, idx: number) => {
      const tabCount = tabList.size();
      // Ensure the tab list is a contiguous array.
      const trueIdx = idx > tabCount || idx < 0 ? tabCount : idx;

      // Add the new item to the tab list.
      onTabListChange(tabList.insertAt(trueIdx, item), trueIdx);
    },
    [tabList, onTabListChange],
  );

  const onOpenOverviewClick = React.useCallback(() => {
    openOverview();
    analytics.track('Toggle All Queries View');
  }, [openOverview]);

  const onTabActivate = React.useCallback(
    (idx: number) => {
      if (activeTabIdx !== idx) {
        dispatch({ type: 'CURRENT_TAB_CHANGE', newTabIdx: idx });
        analytics.track('Click inactive AQT Tab');
      }
    },
    [activeTabIdx, dispatch],
  );

  const onTabItemChange = React.useCallback(
    (item: QueryTabItem, idx: number) => {
      onTabListChange(tabList.set(idx, item));
      analytics.track('Change AQT Tab');
    },
    [onTabListChange, tabList],
  );

  const onTabItemClone = React.useCallback(
    (item: QueryTabItem, insertionIdx: number) => {
      const clonedName = createClonedItemName(item.name(), tabList);
      insertTabItem(item.cloneWithNewName(clonedName), insertionIdx);
      analytics.track('Duplicate AQT Tab');
    },
    [tabList, insertTabItem],
  );

  const onTabItemRemove = React.useCallback(
    (idx: number) => {
      if (!allowTabDeletion) {
        return;
      }

      analytics.track('Delete AQT Tab');
      onTabListChange(tabList.delete(idx));
    },
    [tabList, allowTabDeletion, onTabListChange],
  );

  const onAddTabClick = React.useCallback(() => {
    insertTabItem(QueryTabItem.createWithUniqueId(), tabList.size());
    analytics.track('Add AQT Tab');
  }, [insertTabItem, tabList]);

  const onTabItemReset = React.useCallback(
    (idx: number) => {
      onTabListChange(tabList.apply(idx, tab => tab.reset()));
    },
    [tabList, onTabListChange],
  );

  const overviewButton = ENABLE_TAB_OVERVIEW_PAGE && (
    <div
      className="aqt-tab-list-action-buttons__button"
      data-content={TEXT.overviewButton}
      onClick={onOpenOverviewClick}
      role="button"
    >
      <i className="glyphicon glyphicon-th-large" />
    </div>
  );

  const tabOverview = isOverviewOpen && (
    <QueryTabOverview
      onOverviewClose={closeOverview}
      onTabActivate={onTabActivate}
      tabList={tabList}
    />
  );

  const newTabButton = (
    <div
      className="aqt-tab-list-action-buttons__button"
      data-content={TEXT.newTabButton}
      onClick={onAddTabClick}
      role="button"
    >
      <i className="glyphicon glyphicon-plus" />
    </div>
  );

  const allTabNames = new Set(tabList.map(tab => tab.name()));
  const tabs = tabList.mapValues((item: QueryTabItem, idx: number) => (
    <QueryTab
      key={item.id()}
      allTabNames={allTabNames}
      active={idx === activeTabIdx}
      disableDeletion={!allowTabDeletion}
      idx={idx}
      item={item}
      scrollToTab={scrollToTab}
      onItemChange={onTabItemChange}
      onItemClone={onTabItemClone}
      onItemRemove={onTabItemRemove}
      onTabActivate={onTabActivate}
      onItemReset={onTabItemReset}
    />
  ));

  const leftScrollClassName = classNames('aqt-tab-scroll__button', {
    'aqt-tab-scroll__button--active': isLeftScrollButtonActive,
    'aqt-tab-scroll__button--inactive': !isLeftScrollButtonActive,
  });

  const rightScrollClassName = classNames({
    'aqt-tab-scroll__button--active': isRightScrollButtonActive,
    'aqt-tab-scroll__button--inactive': !isRightScrollButtonActive,
  });

  const scrollButtons = showScrollButtons && (
    <div className="aqt-tab-scroll">
      <button
        type="button"
        className="aqt-tab-scroll__button"
        onClick={() => scrollQueryTabList('left')}
        disabled={!isLeftScrollButtonActive}
      >
        <Icon type="triangle-left" className={leftScrollClassName} />
      </button>
      <button
        type="button"
        className="aqt-tab-scroll__button"
        onClick={() => scrollQueryTabList('right')}
        disabled={!isRightScrollButtonActive}
      >
        <Icon type="triangle-right" className={rightScrollClassName} />
      </button>
    </div>
  );

  const renderTabList = (
    <div
      className="aqt-tab-list"
      onScroll={() => updateActiveScrollButtons()}
      ref={queryTabList}
    >
      <div className="aqt-tab-list__inner-container">{tabs}</div>
    </div>
  );

  return (
    <div className="aqt-tab-list-wrapper">
      <div className="aqt-tab-list-action-buttons" ref={tabListActionButtons}>
        {newTabButton}
        {overviewButton}
      </div>
      {renderTabList}
      {scrollButtons}
      {tabOverview}
    </div>
  );
}

export default (React.memo<Props>(
  QueryTabList,
): React.AbstractComponent<Props>);
