// @flow
import * as React from 'react';

/**
 * A custom hook that allows us to return increment and decrement functions,
 * that can then be used to step forward or backward through dates in
 * the Map timeline.
 *
 * NOTE(nina): By using useRef instead of useState, we can avoid triggering
 * re-renders (and infinite loops) when updating the current values of each
 * function.
 */
export default function useInterval(): [
  { current: () => void },
  { current: () => void },
  { current: IntervalID | void },
] {
  const intervalIdRef = React.useRef<IntervalID | void>(undefined);
  const incrementIndex = React.useRef<() => void>(() => {});
  const decrementIndex = React.useRef<() => void>(() => {});

  // Use an effect with a cleanup function to cancel the interval if it is still
  // set.
  React.useEffect(
    () => () => {
      const { current } = intervalIdRef;
      if (current !== undefined) {
        clearInterval(current);
      }
    },
    [],
  );

  return [decrementIndex, incrementIndex, intervalIdRef];
}
