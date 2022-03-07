// @flow

/**
 * Gets a value from a multi-layered object from the keyPath.
 * Usage:
 *   _getValue({ a: { b: 'c'} }, 'a.b') // 'c'
 */
function _getValue(obj: { +[string]: mixed, ... }, keyPath: string): mixed {
  const keys = keyPath.split('.');
  return keys.reduce((val, key) => {
    if (val && typeof val === 'object') {
      return val[key];
    }
    return undefined;
  }, obj);
}

/**
 * Compare two objects with shallow equality, meaning we just check if all the
 * top-level values of obj1 match all the top-level values of obj2.
 * Equality is checked using `===`.
 */
export function objShallowEq(
  obj1: { +[string]: mixed, ... },
  obj2: { +[string]: mixed, ... },
): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  return keys1.every(key => obj1[key] === obj2[key]);
}

/**
 * Compares two objects at the given key paths for equality.
 * Returns true if all the paths are equal.
 * Usage:
 *   objEq(person1, person2, 'name');
 *   This will compare: person1.name === person2.name
 *
 * You can also do deep comparisons:
 *   objEq(person1, person2, 'name', 'role.name')
 *   This will compare:
 *     person1.name === person2.name AND
 *     person1.role.name === person2.role.name
 */
export function objKeyEq(
  obj1: { +[string]: mixed, ... },
  obj2: { +[string]: mixed, ... },
  keyPaths: Array<string>,
): boolean {
  return keyPaths.every(
    keyPath => _getValue(obj1, keyPath) === _getValue(obj2, keyPath),
  );
}

/**
 * Returns a function that will compare two objects at the given keyPaths.
 * This is designed as syntactic sugar in filters or memoizeOne calls,
 * so you can write:
 *   @memoizeOne(objKeyCompare('name'))
 *   someFunc(person) {}
 * Instead of:
 *   @memoizeOne(
 *     (newPerson, oldPerson) => objKeyEq(newPerson, oldPerson, 'name')
 *   )
 *   someFunc(person) {}
 */
export function objKeyCompare(
  ...keyPaths: Array<string>
): (
  obj1: { +[string]: mixed, ... },
  obj2: { +[string]: mixed, ... },
) => boolean {
  return (obj1: { +[string]: mixed, ... }, obj2: { +[string]: mixed, ... }) =>
    objKeyEq(obj1, obj2, keyPaths);
}

export function isEmpty(obj: { +[string]: mixed, ... }): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Given an object and keys, creates a new object with those keys omitted
 * from the original object.
 * This has the same functionality as the lodash 'omit' function (except
 * that we only allow top-level keys to be picked, and not object paths).
 * If 'keys' is an object, this is equivalent to omit(obj, Object.keys(o))
 * If 'keys' is a string, omit that single string.
 *
 * @deprecated
 */
export function omit(
  obj: { +[string]: mixed, ... },
  keys: $ReadOnlyArray<string> | { +[string]: mixed, ... } | string,
): { +[string]: mixed, ... } {
  if (keys === undefined || keys === null) {
    return obj;
  }

  let rawKeys = [];
  if (Array.isArray(keys)) {
    rawKeys = keys;
  } else if (typeof keys === 'object') {
    rawKeys = Object.keys(keys);
  } else if (typeof keys === 'string') {
    rawKeys.push(keys);
  }

  const keysToOmit = new Set(rawKeys);
  const res = {};
  Object.keys(obj).forEach(key => {
    if (!keysToOmit.has(key)) {
      res[key] = obj[key];
    }
  });
  return res;
}

/**
 * Given an object and keys, creates a new object with those keys picked
 * from the original object.
 * This has the same functionality as the lodash 'pick' function (except
 * that we only allow top-level keys to be picked, and not object paths).
 * If 'keys' is an object, this is equivalent to doing pick(obj, Object.keys(o))
 * If 'keys' is a string, pick that single string
 *
 * @deprecated
 */
export function pick(
  obj: { +[string]: mixed, ... },
  keys: $ReadOnlyArray<string> | { +[string]: mixed } | string,
): { +[string]: mixed, ... } {
  const res = {};
  if (keys === undefined || keys === null) {
    return res;
  }

  const pickKey = key => {
    if (key in obj) {
      res[key] = obj[key];
    }
  };

  if (Array.isArray(keys)) {
    keys.forEach(pickKey);
  } else if (typeof keys === 'object') {
    Object.keys(keys).forEach(pickKey);
  } else if (typeof keys === 'string') {
    pickKey(keys);
  }

  return res;
}
