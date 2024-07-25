// @flow
import * as React from 'react';
import type Promise from 'bluebird';

import { cancelPromise } from 'util/promiseUtil';

type SetPromise<T> = (Promise<T>) => void;

/**
 * This hook allows you to cancel a promise in a functional component that
 * isn't created in a useEffect.
 * Usage:
 *  function MyComponent() {
 *    const myPromise = usePromiseCleanUp();
 *    const someCallback = () => {
 *      myPromise(someHTTPRequest().then(...));
 *    }
 *  }
 *
 * @returns {SetPromise} A function that sets the current promise
 */
export default function usePromiseCleanUp<T>(): SetPromise<T> {
  const [promise, setPromise] = React.useState();
  React.useEffect(() => {
    return () => {
      if (promise) {
        cancelPromise(promise);
      }
    };
  }, [promise]);
  return setPromise;
}
