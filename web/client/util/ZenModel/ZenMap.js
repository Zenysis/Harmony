// @flow
import PropTypes from 'prop-types';

import ZenArray from 'util/ZenModel/ZenArray';
import ZenCollection from 'util/ZenModel/ZenCollection';
import ZenModelUtil from 'util/ZenModel/ZenModelUtil';
import override from 'decorators/override';
import { convertZenModels } from 'util/ZenModel';

/**
 * ZenMap is an immutable wrapper around a JS object.
 * It can be used as a prop type in other models and React components.
 * You should always use ZenMap with Flow types.
 *
 * NOTE(pablo): Read the comment in ZenCollections for a note on performance.
 * NOTE(pablo): Do not extend ZenMap. Type annotations are not guaranteed
 * to be correct if you do that.
 *
 * Specifying as a prop in a component:
 *   import * as Zen from 'lib/Zen';
 *   type Props = {
 *     fields: Zen.Map<Field>,
 *     fieldIds: Zen.Map<string>,
 *   }
 *
 * Specifying as a value type in a ZenModel *without* flow:
 *   class SomeModel extends ZenModel.withTypes({
 *     fieldsMap: def(Zen.Map.of(Field).isRequired),
 *
 *     fieldColors: def(Zen.Map.of(PropTypes.string)),
 *   });
 *
 * All operations on a ZenMap are immutable (meaning things like set() and
 * delete() will return a new instance of ZenMap).
 *
 * Examples:
 *   import * as Zen from 'lib/Zen';
 *   const fieldsMap = Zen.Map.create(fields);
 *   const newMap = fields.set('someId', someField);
 */

type IterationCallback<T, R> = (
  value: T,
  key: string,
  obj: { +[string]: T },
) => R;

type Container<T> = { +[string]: T };

export default class ZenMap<T> extends ZenCollection<Container<T>, T> {
  static create<V>(obj: { +[string]: V } | ZenMap<V> = {}): ZenMap<V> {
    if (obj instanceof ZenMap) {
      return new ZenMap(obj._values);
    }
    return new ZenMap(obj);
  }

  /**
   * Convert an Array or ZenArray to a ZenMap. The values in the ZenMap
   * are the values of the ZenArray. The keys are obtained through the
   * accessor.
   * @param {Array<V> | ZenArray<V>} values
   * @param {String | func(item)} accessor
   *   Examples:
   *     ZenMap.fromArray(fields, 'id');
   *       All fields become keyed by field.id()
   *     ZenMap.fromArray(users, u => `${u.firstName()} ${u.lastName()}`);
   *       All users become keyed by the passed function
   * @returns {ZenMap<V>}
   */
  static fromArray<V>(
    values: $ReadOnlyArray<V> | ZenArray<V>,
    accessor: string | ((model: V) => string),
  ): ZenMap<V> {
    const obj: { [string]: V } = ZenModelUtil.modelArrayToObject(
      values,
      accessor,
    );
    return ZenMap.create(obj);
  }

  @override
  static baseCollectionType(): $PropertyType<ReactPropTypes, 'objectOf'> {
    return (PropTypes.objectOf: any);
  }

  constructor(obj: Container<T> = {}): void {
    super(obj);
    this._validate();
  }

  @override
  serialize(): { [string]: mixed } {
    return convertZenModels(this._values);
  }

  /**
   * Return the wrapped object and clone it. This is a shallow conversion and
   * is an O(n) operation.
   */
  toObject(): { [string]: T } {
    return { ...this._values };
  }

  /**
   * Return the wrapped object. This is an O(1) operation that just returns
   * the wrapped collection, it does not clone it.
   */
  objectView(): { +[string]: T } {
    return this._values;
  }

  size(): number {
    return this.keys().length;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  clear(): ZenMap<T> {
    return new this.constructor({});
  }

  keys(): Array<string> {
    return Object.keys(this._values);
  }

  values(): Array<T> {
    return Object.keys(this._values).map(key => this._values[key]);
  }

  entries(): Array<[string, T]> {
    return Object.keys(this._values).map(key => [key, this._values[key]]);
  }

  zenKeys(): ZenArray<string> {
    return ZenArray.create(this.keys());
  }

  zenValues(): ZenArray<T> {
    return ZenArray.create(this.values());
  }

  zenEntries(): ZenArray<[string, T]> {
    return ZenArray.create(this.entries());
  }

  has(key: string): boolean {
    return key in this._values;
  }

  set(key: string, value: T): ZenMap<T> {
    const newObj = Object.assign({}, this._values, { [key]: value });
    return new this.constructor(newObj);
  }

  delete(keyToDelete: string): ZenMap<T> {
    const oldObj = this._values;
    const newObj = {};
    Object.keys(oldObj).forEach(key => {
      if (key !== keyToDelete) {
        newObj[key] = oldObj[key];
      }
    });
    return new this.constructor(newObj);
  }

  merge(obj: { +[string]: T } | ZenMap<T>): ZenMap<T> {
    const vals = obj instanceof ZenMap ? obj._values : obj;
    return new this.constructor(Object.assign({}, this._values, vals));
  }

  fill<V>(value: V): ZenMap<V> {
    return this.map(() => value);
  }

  /**
   * Set the value of a key by calling fn() on the value.
   * If a defaultValue is passed, this is the value that's passed to
   * the function in case the key does not exist in the map.
   * Equivalent to set(key, fn(get(key, defaultValue))
   * Example:
   *   zenMap.apply(key, model => model.label('something'), Model.create())
   */
  apply<V>(key: string, fn: (value: T | V) => T, defaultValue: V): ZenMap<T> {
    return this.set(key, fn(this.get(key, defaultValue)));
  }

  /**
   * Set the value of a key by calling fn() on the value.
   * Throws an error if the value does not exist in the map.
   */
  forceApply(key: string, fn: (value: T) => T): ZenMap<T> {
    return this.set(key, fn(this.forceGet(key)));
  }

  /**
   * Get the value assigned to a key. If the key does not exist in the map,
   * return defaultValue
   */
  get<V>(key: string, defaultValue: V): T | V {
    return key in this._values ? this._values[key] : defaultValue;
  }

  /**
   * Get the value assigned to a key. Throws an error if the value does not
   * exist in the map.
   */
  forceGet(key: string): T {
    if (key in this._values) {
      return this._values[key];
    }
    const className = this.constructor.classDisplayName();
    throw new Error(`[${className}] '${key}' does not exist in map.`);
  }

  /**
   * Iterate over all (value, key) pairs and return true if
   * `func(value, key)` evaluates to `true` for any of them.
   * @param {Function<value, key, obj>} func
   *   callback function (note that the `value` argument comes first. This is
   *   to keep consistent with the JS Map and Array specs).
   * @param {any} thisArg
   *   value to use as `this` when executing `func`
   * @return boolean
   */
  some(func: IterationCallback<T, boolean>, thisArg?: ?Object): boolean {
    return this.keys().some(
      key => func(this._values[key], key, this._values),
      thisArg,
    );
  }

  /**
   * Iterate over all (value, key) pairs and call `func` on each.
   * @param {Function<value, key, obj>} func
   *   callback function (note that the `value` argument comes first. This is
   *   to keep consistent with the JS Map and Array specs).
   * @param {any} thisArg
   *   value to use as `this` when executing `func`
   * @return undefined
   */
  forEach(func: IterationCallback<T, mixed>, thisArg?: ?Object): void {
    const boundFunc =
      thisArg !== undefined && thisArg !== null ? func.bind(thisArg) : func;
    this.keys().forEach(key => {
      boundFunc(this._values[key], key, this._values);
    });
  }

  /**
   * Remove all key, value pairs from the map that do not return a truthy
   * value for `func(value, key)`
   * The returned ZenMap will be of the same type as the current ZenMap.
   * @param {Function<value, key, obj>} func
   *   callback function, returns a truthy/falsy value
   * @return ZenMap
   */
  filter(func: IterationCallback<T, boolean>, thisArg?: ?Object): ZenMap<T> {
    const boundFunc =
      thisArg !== undefined && thisArg !== null ? func.bind(thisArg) : func;

    const oldObj = this._values;
    const newObj = {};
    this.keys().forEach(key => {
      if (boundFunc(oldObj[key], key, this._values)) {
        newObj[key] = oldObj[key];
      }
    });
    return new this.constructor(newObj);
  }

  /**
   * Reduce this ZenMap to any value. This works very similarly to how an
   * array.reduce function would.
   * @param {Function<accumulator, value, key, obj>} func
   * @param {V} initialValue
   */
  reduce<V>(
    func: (accumulator: V, value: T, key: string, obj: { +[string]: T }) => V,
    initialValue: V,
  ): V {
    return this.keys().reduce(
      (acc: V, key: string) => func(acc, this._values[key], key, this._values),
      initialValue,
    );
  }

  /**
   * Map all the values in the ZenMap to func(value).
   * All the keys remain the same.
   * The values can potentially be of any type, so by default the returned
   * ZenMap will be of the base ZenMap class. If you wanted to cast to
   * a specific custom subclass, pass it as the MapClass parameter.
   * @param {Function<value, key, obj>} func
   *   callback function, returns a new value
   * @return ZenMap
   */
  map<V>(
    func: IterationCallback<T, V>,
    MapClass?: typeof ZenMap = ZenMap,
    thisArg?: ?Object,
  ): ZenMap<V> {
    const boundFunc =
      thisArg !== undefined && thisArg !== null ? func.bind(thisArg) : func;

    const oldObj = this._values;
    const newObj = {};
    this.keys().forEach(key => {
      newObj[key] = boundFunc(oldObj[key], key, this._values);
    });
    return MapClass.create(newObj);
  }
}

ZenMap.displayName = 'ZenMap';

// Export a ZenMap API that is compatible with a ZenModel's deepUpdate() call.
// This only includes functions that take at least one argument (otherwise the
// deepUpdate library won't recognize it as a closing call for .deepUpdate())
// AND returns a new ZenMap of the same type.
export type DeepUpdateZenMapAPI<T, FinalReturn> = {
  set: (key: string, value: T) => FinalReturn,
  delete: (keyToDelete: string) => FinalReturn,
  merge: (obj: { +[string]: T } | ZenMap<T>) => FinalReturn,
  fill: (value: T) => FinalReturn,
  apply: <V>(
    key: string,
    fn: (value: T | V) => T,
    defaultValue: V,
  ) => FinalReturn,
  forceApply: (key: string, fn: (value: T) => T) => FinalReturn,
  filter: (
    func: IterationCallback<T, boolean>,
    thisArg?: ?Object,
  ) => FinalReturn,
  reduce: (
    func: (accumulator: T, value: T, key: string, obj: { +[string]: T }) => T,
    initialValue: T,
  ) => FinalReturn,
  map: (
    func: IterationCallback<T, T>,
    MapClass?: typeof ZenMap,
    thisArg?: ?Object,
  ) => FinalReturn,
};
