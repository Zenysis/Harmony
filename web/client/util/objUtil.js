// @flow
function _getValue(obj: { +[string]: mixed }, keyPath: string): mixed {
  const keys = keyPath.split('.');
  return keys.reduce((val, key) => {
    if (val && typeof val === 'object') {
      return val[key];
    }
    return undefined;
  }, obj);
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
  obj1: { +[string]: mixed },
  obj2: { +[string]: mixed },
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
): (obj1: { +[string]: mixed }, obj2: { +[string]: mixed }) => boolean {
  return (obj1: { +[string]: mixed }, obj2: { +[string]: mixed }) =>
    objKeyEq(obj1, obj2, keyPaths);
}
