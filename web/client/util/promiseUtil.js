// @flow
import Promise from 'bluebird';

type PromiseArray = Array<Promise<any>>;
type PromiseMap = { [string]: Promise<any> };

export function cancelPromise(promise: Promise<any>): void {
  if (promise.isPending()) {
    promise.cancel();
  }
}

export function cancelPromises(
  promiseCollection: PromiseArray | PromiseMap,
): void {
  if (Array.isArray(promiseCollection)) {
    promiseCollection.forEach(cancelPromise);
  } else if (typeof promiseCollection === 'object') {
    const promiseMap: PromiseMap = (promiseCollection: any);
    Object.keys(promiseMap).forEach(promiseId => {
      const promise = promiseMap[promiseId];
      cancelPromise(promise);
    });
  }
}
