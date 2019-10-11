// @flow
import Promise from 'bluebird';
import invariant from 'invariant';

import autobind from 'decorators/autobind';
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
  _requestPromise: Promise<void> | void;
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
  _fetchMapping(): Promise<void> {
    // Return the cache if it was successfully built.
    if (this._mappingCache) {
      return Promise.resolve();
    }

    // If the cache is in the process of being built, return that promise to
    // avoid duplicating requests.
    if (this._requestPromise) {
      return this._requestPromise;
    }

    // No cache has been built yet, so kick off a new request and return a
    // Promise.
    this._requestPromise = new Promise((resolve, reject) => {
      const resetAndReject: RejectFn = this._resetAndReject.bind(this, reject);
      const setMappingAndResolve: ResolveFn<T> = this._setMappingAndResolve.bind(
        this,
        resolve,
      );
      return this.buildCache(setMappingAndResolve, resetAndReject);
    }).finally(() => {
      this._requestPromise = undefined;
    });

    return this._requestPromise;
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
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
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
   * @returns Promise<T>
   */
  @autobind
  get(key: string): Promise<T> {
    if (this._mappingCache) {
      return Promise.resolve(this._mappingCache[key]);
    }

    return this._fetchMapping().then(() => {
      invariant(
        this._mappingCache !== undefined,
        'Mapping cache cannot be undefined if the promise was successful.',
      );
      return this._mappingCache[key];
    });
  }

  /**
   * Retrieve all values from the cache.
   *
   * returns: Promise<Array<T>>
   */
  @autobind
  getAll(): Promise<$ReadOnlyArray<T>> {
    return this._fetchMapping().then(() => {
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
    return this._fetchMapping().then(() => {
      invariant(
        this._valueCache !== undefined,
        'Value cache cannot be undefined if the promise was successful.',
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
   * @returns T
   */
  @autobind
  UNSAFE_get(key: string): T {
    invariant(
      this._mappingCache !== undefined,
      'UNSAFE synchronous get called without mapping cache being defined.',
    );
    return this._mappingCache[key];
  }
}
