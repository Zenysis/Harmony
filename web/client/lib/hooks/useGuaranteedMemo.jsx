// @flow
import * as React from 'react';

import usePrevious from 'lib/hooks/usePrevious';
import { arrayEquality } from 'util/arrayUtil';

// NOTE(stephen): Need a signal that a value has not yet been set. Cannot rely
// on `undefined` since the type of T could be `void`.
const UNSET_VALUE_SYMBOL = Symbol('Unset value');

/**
 * This hook provides a memoized value created by evaluating the evaluatorFn. It
 * is only re-evaluated when the dependencies array changes. It has the same
 * interface as React.useMemo but differs in that it provides a semantic
 * guarantee that the value will not be re-computed unless the dependencies
 * change. Use Cases:
 *  If you need a performance optimization, then use React.useMemo.
 *  If you need a semantic guarantee of memoization, then use useGuaranteedMemo.

 * @param {() => T} evaluatorFn The function to compute the memoized value.
 * @param {() => T} dependencies The function dependencies. If any of these
 * change, the value will be re-computed.
 * @returns {T} The memoized value.
 */
export default function useGuaranteedMemo<T>(
  evaluatorFn: () => T,
  dependencies: $ReadOnlyArray<mixed>,
): T {
  const prevDependencies = usePrevious(dependencies);
  const valueRef = React.useRef<T | typeof UNSET_VALUE_SYMBOL>(
    UNSET_VALUE_SYMBOL,
  );

  const dependenciesHaveChanged =
    prevDependencies === undefined ||
    !arrayEquality(dependencies, prevDependencies);

  if (valueRef.current === UNSET_VALUE_SYMBOL || dependenciesHaveChanged) {
    valueRef.current = evaluatorFn();
  }

  // NOTE(david): This cast is fine since valueRef.current will never be
  // UNSET_VALUE_SYMBOL at this point.
  return ((valueRef.current: $Cast): T);
}
