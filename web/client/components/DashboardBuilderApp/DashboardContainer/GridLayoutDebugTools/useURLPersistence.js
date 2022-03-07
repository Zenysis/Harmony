// @flow
import * as React from 'react';

import Toaster from 'components/ui/Toaster';

/**
 * Store debug value overrides in the URL. Read them in when the hook first runs
 * and return them as the initial state value to be used by the caller.
 *
 * HACK(stephen): This hook is part of a larger hack and likely should not be
 * used anywhere else in the codebase.
 */
export default function useURLPersistence<T: { ... }>(
  key: string,
  defaultValue: T,
): [
  (T) => void, // onUpdateURL
  T, // initialState
] {
  // Read the URL exactly once to find the overrides. If they are set, return
  // them. Otherwise, return the default value.
  // NOTE(stephen): Setting 0 dependencies so that this initial state is
  // computed once. This hook does not support changes to key or default value.
  const initialState = React.useMemo(() => {
    const hashParams = new URLSearchParams(window.location.hash.substr(1));
    const savedOverridesStr = hashParams.get(key);
    if (!savedOverridesStr) {
      return defaultValue;
    }

    try {
      const savedOverrides = JSON.parse(savedOverridesStr);
      return savedOverrides;
    } catch {
      Toaster.error(`Unable to parse saved ${key} overrides from URL`);
      return defaultValue;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist the overrides in the URL.
  const onUpdateURL = React.useCallback(
    (newOverrides: T) => {
      const hashParams = new URLSearchParams(window.location.hash.substr(1));
      hashParams.set(key, JSON.stringify(newOverrides));
      window.location.hash = hashParams.toString();
    },
    [key],
  );

  return [onUpdateURL, initialState];
}
