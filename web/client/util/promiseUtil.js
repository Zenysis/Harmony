// @flow
import Promise from 'bluebird';

type PromiseArray = $ReadOnlyArray<Promise<mixed>>;
type PromiseMap = { +[string]: Promise<mixed>, ... };

export function cancelPromise(promise: Promise<mixed>): void {
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
    const promiseMap = promiseCollection;
    Object.keys(promiseMap).forEach(promiseId => {
      const promise = promiseMap[promiseId];
      cancelPromise(promise);
    });
  }
}

/**
 * The UncancellablePromise will prevent any Promise cancellation event from
 * reaching the stored promise. This is particularly useful for expensive
 * network calls that are going to be cached (like retrieving a dataset). In
 * those times, it is preferred to allow the network call to complete (and any
 * post-processing to happen) instead of having the initial promise get
 * cancelled and start over again.
 *
 * Usage:
 *   Construct a promise that you do not want to be cancelled. Every time the
 *   UncancellablePromise is used, this promise will be the first one resolved.
 *     const innerPromise = new Promise((resolve, reject) => {});
 *     const uncancellablePromise = UncancellablePromise.create(innerPromise);
 *
 *   When you want to chain off this uncancellable promise, call the `use`
 *   method.
 *     return uncancellablePromise.use();
 */
export class UncancellablePromise<T> {
  +_promise: Promise<T>;

  static create(parentPromise: Promise<T>): this {
    return new this(parentPromise);
  }

  constructor(parentPromise: Promise<T>) {
    // Wrap the input promise in a new promise so that we don't mutate the input
    // argument.
    this._promise = new Promise((resolve, reject) =>
      parentPromise.then(resolve).catch(reject),
    );

    // Disable cancellation for this promise. We never want the parent promise
    // to be cancelled since caching and completing the promise is much more
    // useful than restarting it.
    // HACK(stephen): Override the internal `Bluebird.Promise` method to ensure
    // a promise cancellation chain will not cancel this promise.
    // $FlowExpectedError[prop-missing] this is not exposed as part of the public API, but we're aware of the risk
    this._promise._isCancellable = () => false;
  }

  /**
   * Build a normal Promise that will resolve when the uncancellable promise
   * completes. This returned promise is cancellable.
   */
  use(): Promise<T> {
    // Wrap the uncancellable promise in a new promise. If the uncancellable
    // promise is used directly in a chain (with `.then`) then the subsequent
    // calls to `.then` will not be cancelled, potentially resulting in
    // unexpected behavior. By wrapping the uncancellable promise, we can ensure
    // the cancellation behavior works correctly for all users of the promise.
    // TODO(stephen): We are continuously adding to the `.then` and `.reject`
    // chains of the original promise. Even though these handlers won't get
    // called (since they are the new Promise's `resolve/reject` functions), we
    // could be building up a large callback chain for the original promise to
    // deal with.
    return new Promise((resolve, reject) =>
      this._promise.then(resolve).catch(reject),
    );
  }
}
