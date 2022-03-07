// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import QueryTabItem from 'models/AdvancedQueryApp/QueryTabItem';

type ScrollQueryTabListFn = (scrollDirection: 'left' | 'right') => void;
type ScrollToTabFn = (activeTab: HTMLDivElement) => void;
type UpdateActiveScrollButtonsFn = () => void;

function queryTabNamesChanged(
  tabList: Zen.Array<QueryTabItem>,
  prevTabList: Zen.Array<QueryTabItem> | void,
): boolean {
  if (prevTabList === undefined || tabList.size() !== prevTabList.size()) {
    return true;
  }

  // Check to see if the names are different since the tab list sizes have
  // not changed.
  return tabList.some((tab, idx) => tab.name() !== prevTabList.get(idx).name());
}

/**
 * Custom hook that supports scrolling of our tab list. It
 * returns 3 booleans and a function,
 * 1. A boolean showScrollButtons that is responsible to hiding and unhiding the scroll buttons
 * 2. A boolean isLeftScrollButtonActive that actives and deactivates left scroll button
 * 3. A boolean isRightScrollButtonActive that activates and deactivates right scroll button
 * 4. A function scrollQueryTabList that scrolls the tablist
 */
export default function useScrollQueryTabList(
  queryTabList: $ElementRefObject<'div'>,
  tabList: Zen.Array<QueryTabItem>,
  tabListActionButtons: $ElementRefObject<'div'>,
  prevTabList: void | Zen.Array<QueryTabItem>,
): [
  boolean,
  boolean,
  boolean,
  UpdateActiveScrollButtonsFn,
  ScrollQueryTabListFn,
  ScrollToTabFn,
] {
  const [showScrollButtons, setShowScrollButtons] = React.useState(true);
  const [
    isLeftScrollButtonActive,
    setIsLeftScrollButtonActive,
  ] = React.useState(false);
  const [
    isRightScrollButtonActive,
    setIsRightScrollButtonActive,
  ] = React.useState(false);

  const updateActiveScrollButtons = React.useCallback(
    (newScrollLeft?: number) => {
      if (queryTabList.current) {
        const scrollLeft =
          newScrollLeft === undefined
            ? queryTabList.current.scrollLeft
            : newScrollLeft;
        const isScrollLeftActive = scrollLeft > 0;
        const maximumScroll =
          queryTabList.current.scrollWidth - queryTabList.current.clientWidth;
        const isScrollRightActive = scrollLeft < maximumScroll;
        setIsLeftScrollButtonActive(isScrollLeftActive);
        setIsRightScrollButtonActive(isScrollRightActive);
      }
    },
    [queryTabList],
  );

  const updateShowScrollButtons = React.useCallback(() => {
    // HACK(istephen) 1 is added to offsetWidth since scroll width
    // is greater than the offset width by 1 at a point when they were supposed to be equal
    if (queryTabList.current) {
      const showScrolls =
        queryTabList.current.scrollWidth > queryTabList.current.offsetWidth + 1;
      setShowScrollButtons(showScrolls);
    }
  }, [queryTabList]);

  React.useEffect(() => {
    updateShowScrollButtons();

    // when component resizes, scroll buttons should be shown or hidden
    const resizeListener = () => {
      updateShowScrollButtons();
    };
    // set resize listener
    window.addEventListener('resize', resizeListener);

    // clean up function
    return () => {
      // remove resize listener
      window.removeEventListener('resize', resizeListener);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When the component's tabList prop updates, we should check if the scroll
  // buttons should be shown and which of the scroll buttons to activate
  React.useEffect(() => {
    if (queryTabNamesChanged(tabList, prevTabList) && queryTabList.current) {
      updateShowScrollButtons();
      updateActiveScrollButtons();
    }
  }, [
    queryTabList,
    prevTabList,
    tabList,
    updateActiveScrollButtons,
    updateShowScrollButtons,
  ]);

  const scrollQueryTabList = React.useCallback(
    (scrollDirection: 'left' | 'right') => {
      if (queryTabList.current) {
        const queryTabsListElement = queryTabList.current;
        const prevScrollLeft = queryTabsListElement.scrollLeft;
        const scrollByValue =
          scrollDirection === 'left'
            ? -queryTabsListElement.offsetWidth
            : queryTabsListElement.offsetWidth;

        queryTabList.current.scrollBy({
          left: scrollByValue,
          behavior: 'smooth',
        });

        const nextScrollLeft = prevScrollLeft + scrollByValue;
        updateActiveScrollButtons(nextScrollLeft);
      }
    },
    [queryTabList, updateActiveScrollButtons],
  );

  const scrollToPosition = React.useCallback(
    (newScrollLeft, prevScrollLeft) => {
      if (queryTabList.current) {
        queryTabList.current.scrollBy({
          left: newScrollLeft - prevScrollLeft,
          behavior: 'smooth',
        });

        updateActiveScrollButtons(newScrollLeft);
      }
    },
    [updateActiveScrollButtons, queryTabList],
  );

  const scrollToTab = React.useCallback(
    activeTab => {
      if (activeTab && queryTabList.current && tabListActionButtons.current) {
        const queryTabsListElement = queryTabList.current;
        const actionButtonsElement = tabListActionButtons.current;
        const activeTabPosition = activeTab.offsetLeft;
        const activeTabWidth = activeTab.clientWidth;
        const prevScrollLeft = queryTabsListElement.scrollLeft;
        const tabsListWidth = queryTabsListElement.clientWidth;
        const actionButtonsWidth = actionButtonsElement.clientWidth;

        // If active tab is off screen to the left
        if (activeTabPosition < prevScrollLeft) {
          scrollToPosition(activeTabPosition, prevScrollLeft);
        }

        // If active tab is off screen to the right
        if (
          activeTabPosition + activeTabWidth >
          prevScrollLeft + tabsListWidth
        ) {
          // HACK(stephen.byarugaba): `activeTab.offsetLeft` seems to include
          // this distance when the page is fully loaded, but not when it is
          // loading. We can get away with always having it here because:
          // - we only add the distance when the tab is off screen to the right
          // - the tab can never be off-screen to the left when the page first
          //   loads
          const newScrollLeft =
            activeTabPosition +
            activeTabWidth +
            actionButtonsWidth - // take into account space taken by action btns
            tabsListWidth;
          scrollToPosition(newScrollLeft, prevScrollLeft);
        }
      }
    },
    [queryTabList, tabListActionButtons, scrollToPosition],
  );

  return [
    showScrollButtons,
    isLeftScrollButtonActive,
    isRightScrollButtonActive,
    updateActiveScrollButtons,
    scrollQueryTabList,
    scrollToTab,
  ];
}
