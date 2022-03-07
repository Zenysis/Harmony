// @flow
import * as React from 'react';
import Promise from 'bluebird';
import invariant from 'invariant';

import { UncancellablePromise, cancelPromise } from 'util/promiseUtil';

type LoadingState = {
  complete: boolean,
  request: UncancellablePromise<void> | void,
};

type OneTimeRequestInfo<T> = {
  loadState: LoadingState,
  value: T,
};

// Maps a request function to it's OneTimeRequestInfo state
const REQUEST_SINGLETON_MAP: WeakMap<
  () => Promise<$AllowAny>,
  OneTimeRequestInfo<$AllowAny>,
> = new WeakMap();

/**
 * Loads an arbitrary request *exactly once per page** and returns the results.
 * This relies on requestFunc being a reference to the same function each time
 * this hook is used for the same request. If the function is re-created then
 * the optimizations would be lost and using this hook would be pointless. As
 * such, we enforce that referential equality and will throw an error if
 * requestFunc changes after initialization.
 *
 * NOTE(david): This hook violates some of the rules of hooks by introducing
 * global returnValue to the hook. We are doing this because certain dashboard
 * information is best to access at the tile level (e.g. case management info,
 * query form permissions) but we only want to issue the server request once.
 */
export default function useOneTimeRequest<T>(
  initialValue: T,
  requestFunc: () => Promise<T>,
): T {
  // If the entry in REQUEST_SINGLETON_MAP has been initialized
  const isInitializedRef = React.useRef(false);

  // If this is the first time this request has ever been made, initialize the
  // singleton for this request type.
  if (!REQUEST_SINGLETON_MAP.has(requestFunc)) {
    // The requestFunc argument argument should never change after
    // initialization. Doing so would defeat the point of this hook.
    invariant(
      !isInitializedRef.current,
      '`requestFunc` has changed since the hook first ran',
    );

    const initialRequestState = {
      loadState: {
        complete: false,
        request: undefined,
      },
      value: initialValue,
    };
    REQUEST_SINGLETON_MAP.set(requestFunc, initialRequestState);
    isInitializedRef.current = true;
  }

  const currentRequestState = REQUEST_SINGLETON_MAP.get(requestFunc);

  invariant(
    currentRequestState !== undefined,
    'currentRequestState cannot be undefined after initialization',
  );

  // Initialize the returnValue to be the current request value. If the request
  // is in progress, this value should match the `initialValue` provided by the
  // user. If the request has completed, this value will contain the final
  // value.
  const [returnValue, setReturnValue] = React.useState<T>(initialValue);

  React.useEffect(() => {
    // If the request has finished loading, update the state to hold the final
    // value.
    if (currentRequestState.loadState.complete) {
      // NOTE(stephen): Only call `setState` if the value has changed from the
      // current state. Technically React eventually performs this check for
      // you, but it is simple enough to short circuit right here.
      if (returnValue !== currentRequestState.value) {
        setReturnValue(currentRequestState.value);
      }

      return;
    }

    // If no request has yet been started, build a new request and cache the
    // promise. The Promise that loads the info is *uncancellable*, so we will
    // always be able to store the data in the cache even if the component
    // unmounts.
    if (currentRequestState.loadState.request === undefined) {
      currentRequestState.loadState.request = UncancellablePromise.create(
        requestFunc().then(newState => {
          currentRequestState.loadState.complete = true;
          currentRequestState.value = newState;
        }),
      );
    }

    const promise = currentRequestState.loadState.request.use().then(() => {
      setReturnValue(currentRequestState.value);
    });

    // NOTE(stephen): Disabling this lint here because there is no reason to
    // define a "cleanup" function (at top of useEffect) that does nothing just
    // to satisfy the linter.
    // eslint-disable-next-line consistent-return
    return () => cancelPromise(promise);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return returnValue;
}
