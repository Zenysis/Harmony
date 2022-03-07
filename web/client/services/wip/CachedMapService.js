// @flow
import Promise from 'bluebird';
import invariant from 'invariant';

import autobind from 'decorators/autobind';
import { UncancellablePromise } from 'util/promiseUtil';
import { noop } from 'util/util';

export type Cache<T> = {| [string]: T |};
export type ResolveFn<T> = (Cache<T>) => void;
export type RejectFn = (error: ?mixed) => void;

/**
 * The CachedMapService base class provides a simple way to coordinate the
 * retrieval and caching of asynchronous key/value data. It's primary use is for
 * "fetch once and store" type operations, but it can be easily adapted to more
 * complex fetch and retrieval strategies.
 *
 * Implementing classes must override the `buildCache` method.
 */
export default class CachedMapService<T> {
  _mappingCache: Cache<T> | void;
  _requestPromise: UncancellablePromise<void> | void;
  _valueCache: $ReadOnlyArray<T> | void;

  constructor() {
    this._resetAndReject(noop);
  }

  _resetAndReject(rejectFn: (error: ?mixed) => void, error: ?mixed): void {
    this._mappingCache = undefined;
    this._valueCache = undefined;
    this._requestPromise = undefined;
    rejectFn(error);
  }

  _setMappingAndResolve(resolveFn: () => void, mapping: Cache<T>): void {
    this._mappingCache = mapping;
    // NOTE(stephen): Avoiding Object.values here since flow thinks it returns
    // Array<mixed> type.
    this._valueCache = Object.keys(mapping).map(k => mapping[k]);
    resolveFn();
  }

  /**
   * Handle the building of and access to the cached object. Return a promise
   * that will resolve when the cache is able to be accessed.
   *
   * @returns Promise
   */
  @autobind
  fetchMapping(): Promise<void> {
    // Return the cache if it was successfully built.
    if (this._mappingCache) {
      return Promise.resolve();
    }

    // If the cache is in the process of being built, use the original promise
    // to avoid issuing duplicate requests.
    if (this._requestPromise) {
      return this._requestPromise.use();
    }

    // No cache has been built yet, so kick off a new request and return a
    // Promise.
    const promise = new Promise((resolve, reject) => {
      const resetAndReject: RejectFn = this._resetAndReject.bind(this, reject);
      const setMappingAndResolve: ResolveFn<T> = this._setMappingAndResolve.bind(
        this,
        resolve,
      );
      return this.buildCache(setMappingAndResolve, resetAndReject);
    }).finally(() => {
      this._requestPromise = undefined;
    });

    // Wrap the data requesting promise in an uncancellable promise so that the
    // network request and cache creation is *always* completed. This is desired
    // because CachedMapService requests are often large. Since building the
    // initial cache is not dependent on any parameters (it just fetches data
    // from an endpoint with no arguments and unpacks the result) there is no
    // danger to reusing the same request multiple times.
    this._requestPromise = UncancellablePromise.create(promise);
    return this._requestPromise.use();
  }

  /**
   * `buildCache` is used by implementing classes to perform the asynchronous
   * retrieval of data to cache. The implementing class should return a
   * new Promise, and when the object to cache has been fully built, it should
   * call `resolve(mappingToCache)`.
   *
   * resolve: f(Object<string, T>)
   * reject: f(error)
   *
   * @returns Promise
   */
  // eslint-disable-next-line no-unused-vars
  buildCache(resolve: ResolveFn<T>, reject: RejectFn): Promise<Cache<T>> {
    throw Error(
      '[CachedMapService] buildCache must be implemented by subclass.',
    );
  }

  /**
   * Retrieve a single value from the cache.
   *
   * key: string
   *
   * @returns Promise<T | void>
   */
  @autobind
  get(key: string): Promise<T | void> {
    if (this._mappingCache) {
      return Promise.resolve(this._mappingCache[key]);
    }

    return this.fetchMapping().then(() => {
      invariant(
        this._mappingCache !== undefined,
        'Mapping cache cannot be undefined if the promise was successful.',
      );
      return this._mappingCache[key];
    });
  }

  /**
   * Retrieve a single value from the cache and error if the value does not
   * exist in the cache.
   *
   * key: string
   *
   * @returns Promise<T>
   */
  @autobind
  forceGet(key: string): Promise<T> {
    return this.get(key).then((value: T | void) => {
      if (value === undefined) {
        throw new Error(`Unable to find value for key in cache: ${key}`);
      }
      return value;
    });
  }

  /**
   * Retrieve all values from the cache.
   *
   * returns: Promise<Array<T>>
   */
  @autobind
  getAll(): Promise<$ReadOnlyArray<T>> {
    return this.fetchMapping().then(() => {
      invariant(
        this._valueCache !== undefined,
        'Value cache cannot be undefined if the promise was successful.',
      );
      return this._valueCache;
    });
  }

  /**
   * Return internal cache.
   *
   * returns: Promise<Cache<T>>
   */
  @autobind
  getMap(): Promise<$ReadOnly<Cache<T>>> {
    return this.fetchMapping().then(() => {
      invariant(
        this._valueCache !== undefined && this._mappingCache !== undefined,
        'Value cache and mapping cache cannot be undefined if the promise was successful.',
      );
      return this._mappingCache;
    });
  }

  /**
   * Synchronously get a value from the cache. This method is unsafe and should
   * only be used in specific situations (like performant deserialization) after
   * the mapping cache is known to have been built.
   *
   * key: string
   *
   * @returns T | void
   */
  @autobind
  UNSAFE_get(key: string): T | void {
    invariant(
      this._mappingCache !== undefined,
      'UNSAFE synchronous get called without mapping cache being defined.',
    );
    return this._mappingCache[key];
  }

  /**
   * Synchronously get a value from the cache. This method is unsafe and should
   * only be used in specific situations (like performant deserialization) after
   * the mapping cache is known to have been built. Throws an error if the value
   * does not exist in the cache.
   *
   * key: string
   *
   * @returns T | void
   */
  @autobind
  UNSAFE_forceGet(key: string): T {
    invariant(
      this._mappingCache !== undefined,
      'UNSAFE synchronous get called without mapping cache being defined.',
    );
    const output = this._mappingCache[key];
    if (output === undefined) {
      throw new Error(`Unable to find value for key in cache: ${key}`);
    }
    return output;
  }
}
