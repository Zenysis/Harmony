// @flow
import * as React from 'react';

/**
 * Keeps table header in sync with the table body when scrolling horizontally
 */
export default function useSynchronousHorizontalScrolling(
  headerRef: $ElementRefObject<'div'>,
  bodyRef: $ElementRefObject<'div'>,
) {
  const onTableScroll = React.useCallback(() => {
    const body = bodyRef.current;
    const header = headerRef.current;
    if (body && header) {
      // keep the table and header scroll positions in sync
      header.scrollLeft = body.scrollLeft;
    }
  }, [bodyRef, headerRef]);

  React.useEffect(() => {
    const body = bodyRef.current;
    if (body) {
      body.addEventListener('scroll', onTableScroll);
    }
    return () => {
      if (body) {
        body.removeEventListener('scroll', onTableScroll);
      }
    };
  }, [bodyRef, onTableScroll]);
}
