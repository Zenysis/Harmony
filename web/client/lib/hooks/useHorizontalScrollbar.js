// @flow
import * as React from 'react';

/**
 * This hook enables the separation of a scrollbar element from its enclosing
 * table. A separated scrollbar always stays in the viewport when the table
 * contents extend beneath the bottom of the viewport.
 *
 * As such we need to manually keep the scrollbar and the actual table contents
 * in sync as well as the table header via onHorizontalScrollPositionChange.
 */
export default function useHorizontalScrollbar(
  horizontalScrollPosition: number,
  onHorizontalScrollPositionChange: number => void,
): [
  $ElementRefObject<'div'>,
  $ElementRefObject<'div'>,
  (Event) => void,
  (Event) => void,
] {
  const mainContentWrapperRef = React.useRef(null);
  const scrollbarRef = React.useRef(null);

  React.useLayoutEffect(() => {
    if (mainContentWrapperRef && mainContentWrapperRef.current) {
      mainContentWrapperRef.current.scrollLeft = horizontalScrollPosition;
    }
    if (scrollbarRef && scrollbarRef.current) {
      scrollbarRef.current.scrollLeft = horizontalScrollPosition;
    }
  }, [mainContentWrapperRef, horizontalScrollPosition]);

  const onScrollbarHorizontalScroll = event => {
    event.stopPropagation();
    if (scrollbarRef && scrollbarRef.current) {
      onHorizontalScrollPositionChange(scrollbarRef.current.scrollLeft);
    }
  };

  const onTableHorizontalScroll = event => {
    event.stopPropagation();
    if (mainContentWrapperRef && mainContentWrapperRef.current) {
      onHorizontalScrollPositionChange(
        mainContentWrapperRef.current.scrollLeft,
      );
    }
  };

  return [
    mainContentWrapperRef,
    scrollbarRef,
    onTableHorizontalScroll,
    onScrollbarHorizontalScroll,
  ];
}
