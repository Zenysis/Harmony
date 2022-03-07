// @flow
import * as React from 'react';

import ResizeService from 'services/ui/ResizeService';
import type { Dimensions } from 'types/common';

/**
 * A hook to provide the current size of the users browser window.
 *
 * TODO(david): Switch this hook to use the ElementResizeService. To do that,
 * we will need to call resizeRegistration.setRef(document.body) and also modify
 * that class to allow for multiple observers of the same element. It currently
 * only allows for one which wouldn't work for a general purpose hook such as
 * this.
 */
export default function useWindowSize(): Dimensions {
  const [size, setSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  React.useEffect(() => {
    const resizeSubscription = ResizeService.subscribe((e, newSize) => {
      setSize(newSize);
    });
    return () => ResizeService.unsubscribe(resizeSubscription);
  }, []);

  return size;
}
