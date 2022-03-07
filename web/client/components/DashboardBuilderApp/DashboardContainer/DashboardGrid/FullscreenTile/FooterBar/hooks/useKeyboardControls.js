// @flow
import * as React from 'react';

/**
 * Hook that detects when the user is navigating the fullscreen experience using
 * their keyboard.
 *
 * Left arrow key - Navigate to the previous tile
 * Right arrow key - Navigate to the next tile
 * Escape key - Exit fullscreen mode
 * Spacebar - Toggle the autoplay setting
 */
export default function useKeyboardControls(
  onNavigateNextPage: () => void,
  onNavigatePreviousPage: () => void,
  onToggleAutoplay: () => void,
  onExitFullscreen: () => void,
) {
  // NOTE(stephen): Need to use a ref to store this callback so that it is
  // accessible inside an event listener. We don't want to disconnect and
  // reconnect the event listener every time the callbacks change.
  const onKeyDown = (key: $PropertyType<KeyboardEvent, 'key'>) => {
    if (key === 'ArrowLeft') {
      onNavigatePreviousPage();
      return true;
    }

    if (key === 'ArrowRight') {
      onNavigateNextPage();
      return true;
    }

    if (key === ' ') {
      onToggleAutoplay();
      return true;
    }

    if (key === 'Escape') {
      onExitFullscreen();
      return true;
    }

    return false;
  };

  const onKeyDownRef = React.useRef(onKeyDown);
  onKeyDownRef.current = onKeyDown;

  React.useEffect(() => {
    const callback = (e: KeyboardEvent) => {
      const shouldPreventDefault = onKeyDownRef.current(e.key);
      if (shouldPreventDefault) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', callback);
    return () => document.removeEventListener('keydown', callback);
  }, []);
}
