// @flow
import * as React from 'react';

/**
 * Register an element to be observed by an IntersectionObserver when the
 * popover is open.
 */
export default function useElementObservation(
  element: HTMLElement | null | void,
  observer: IntersectionObserver,
  isOpen: boolean,
) {
  React.useEffect(() => {
    if (!element || !isOpen) {
      return;
    }

    observer.observe(element);
    // eslint-disable-next-line consistent-return
    return () => observer.unobserve(element);
  }, [element, isOpen, observer]);
}
