// @flow
import * as React from 'react';

import { debounce } from 'util/util';

/**
 * This hook returns a debounced callback.
 * @param {Function} callback The callback to debounce
 * @param {number} wait The amount of milliseconds to wait
 * @param {Array<mixed>} inputs The array of inputs for the `callback` function.
 *   This behaves the same way as the inputs to `React.useCallback`
 * @returns {Function} The debounced callback
 *
 * NOTE(pablo): If the `inputs` change, the debounced function will still call
 * your callback with the new inputs (as expected), but it will NOT create a
 * new function identity (as opposed to `useCallback` which generates a new
 * function identity when the inputs change). The function identity returned
 * by `useDebouncedCallback` is **stable**. This is necessary to make the
 * debouncing logic work. So if you're relying on the function identity being
 * recreated then this will not work.
 */
export default function useDebouncedCallback<
  T: (...args: $ReadOnlyArray<empty>) => mixed,
>(callback: T, wait: number, inputs: ?$ReadOnlyArray<mixed>): T {
  const fn = React.useCallback(callback, inputs);
  const fnRef = React.useRef(fn);
  const debouncedFn = React.useCallback(debounce(fnRef, wait), []);

  React.useEffect(() => {
    fnRef.current = fn;
  }, inputs); // eslint-disable-line react-hooks/exhaustive-deps

  return debouncedFn;
}
