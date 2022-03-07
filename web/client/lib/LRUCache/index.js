// @flow
import invariant from 'invariant';

/**
 * A space efficient cache implementation that stores up to `capacity` entries
 * in an internal map. Items are evicted from the cache if capacity is reached
 * based on a "least recently used" policy. The cache item that has not been
 * accessed in the longest time is the first to be evicted.
 */
export default class LRUCache<T> {
  _capacity: number;

  // The underlying container backing this LRUCache is a Map. A Map preserves
  // insertion order and is one of the simplest ways to implement an LRUCache
  // since we are able to rely on the Map's internal record keeping instead of
  // maintaining the ordering ourselves. This comes at a cost for key retrieval,
  // though, as we must continuously remove and reset values into the Map to
  // ensure the LRU ordering is maintained.
  _map: Map<string, $NonMaybeType<T>> = new Map();

  // Cache the most recently accessed entry to speed up continuous access.
  _last: { key?: string, value?: T } = { key: undefined, value: undefined };

  constructor(capacity: number = 2000) {
    invariant(capacity > 0, 'Capacity must be positive: %s', capacity);
    this._capacity = capacity;
  }

  /**
   * Retrieve the stored value for the given key. If the key does not exist,
   * return undefined. When a key is accessed, it will move to the end of the
   * eviction order.
   */
  get(key: string): T | void {
    // Fast path: continually accessing the same recent key will be optimized.
    if (this._last.key === key) {
      return this._last.value;
    }

    if (!this._map.has(key)) {
      return undefined;
    }

    // Retrieve the value from the cache.
    const value = this._map.get(key);
    /* ::
    // HACK(stephen): Force flow to refine this type without introducing a
    // runtime cost.
    invariant(value !== undefined, '');
    */

    // Since a Map preserves insertion order, we need to delete and reset this
    // key's value so that it becomes the last item inserted.
    this._map.delete(key);
    this._map.set(key, value);

    // Update the fast path cache.
    this._last.key = key;
    this._last.value = value;
    return value;
  }

  /**
   * Set a value for the given key in the cache.
   */
  set(key: string, value: T): void {
    if (this._map.size >= this._capacity) {
      const firstEntry = this._map.keys().next();

      // NOTE(stephen): The iterator should always have `done: false` but this
      // check is needed to make Flow happy.
      if (!firstEntry.done) {
        this.delete(firstEntry.value);
      }
    }

    this._map.delete(key);
    this._map.set(key, value);
    this._last.key = key;
    this._last.value = value;
  }

  /**
   * Check if the given key is in the cache.
   */
  has(key: string): boolean {
    return this._map.has(key);
  }

  /**
   * Delete the cache entry for the given key.
   */
  delete(key: string): void {
    this._map.delete(key);
  }

  /**
   * Returns a copy of the current contents of the cache.
   */
  snapshot(): Map<string, $NonMaybeType<T>> {
    return new Map(this._map);
  }

  /**
   * Returns an immutable view of the current cache contents.
   */
  snapshotView(): $ReadOnlyMap<string, $NonMaybeType<T>> {
    return this._map;
  }
}
