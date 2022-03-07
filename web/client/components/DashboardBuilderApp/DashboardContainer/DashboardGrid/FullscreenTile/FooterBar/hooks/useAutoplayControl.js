// @flow
import * as React from 'react';

import useToggleBoolean from 'lib/hooks/useToggleBoolean';

export default function useAutoplayControl(
  onNavigateNextPage: () => void,
  delay: number,
): [
  boolean, // Is currently playing?
  () => void, // Toggle playing state
] {
  const [playing, onToggleAutoplay] = useToggleBoolean(false);

  // NOTE(stephen): Using a ref since we need to have access to the latest value
  // of `onNavigateNextPage` inside the `setInterval` callback.
  const onNavigateNextPageRef = React.useRef(onNavigateNextPage);
  onNavigateNextPageRef.current = onNavigateNextPage;

  // eslint-disable-next-line consistent-return
  React.useEffect(() => {
    if (playing) {
      const timer = setInterval(() => onNavigateNextPageRef.current(), delay);
      return () => clearInterval(timer);
    }
  }, [delay, playing]);

  return [playing, onToggleAutoplay];
}
