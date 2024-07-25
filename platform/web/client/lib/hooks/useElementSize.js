// @flow
import * as React from 'react';

import ElementResizeService from 'services/ui/ElementResizeService';

type Size = {
  height: number,
  width: number,
};

/**
 * This hook allows you to keep track of an element's size. It is a fairly thin
 * wrapper around the ElementResizeService.
 * Usage:
 *   function MyComponent() {
 *     const [size, ref] = useElementSize();
 *     return <div ref={ref}>Some Content</div>
 *   }
 *
 * @param {Size} initialSize The initial value of size
 * @returns {(T | null) => void} The ref to attach to the element whose size we
 * want to track.
 */
export default function useElementSize<T: Element>(
  initialSize: Size = { height: 0, width: 0 },
): [Size, (T | null | void) => void] {
  const [size, setSize] = React.useState(initialSize);
  const mounted = React.useRef(false);

  React.useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  // Memoize the registration call so we don't reregister on every render.
  const resizeRegistration = React.useMemo(
    () =>
      ElementResizeService.register(({ contentRect }: ResizeObserverEntry) =>
        mounted.current
          ? setSize({
              height: contentRect.height,
              width: contentRect.width,
            })
          : undefined,
      ),
    [],
  );

  return [size, resizeRegistration.setRef];
}
