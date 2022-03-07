// @flow
import { objShallowEq, objKeyEq, objKeyCompare, isEmpty } from 'util/objUtil';

describe('objUtil', () => {
  test('`objShallowEq` returns true for empty objects', () => {
    expect(objShallowEq({}, {})).toBe(true);
  });

  test('`objShallowEq` returns false for different objects', () => {
    expect(objShallowEq({ prop1: 5 }, { prop2: true })).toBe(false);
    expect(objShallowEq({ prop1: 5 }, { prop1: 5, prop2: false })).toBe(false);
  });

  test('`objShallowEq` returns true for shallowly equal objects', () => {
    const obj = { prop1: '', prop2: 5 };
    expect(
      objShallowEq(
        { prop1: 5, prop2: true, prop3: obj },
        { prop1: 5, prop2: true, prop3: obj },
      ),
    ).toBe(true);
  });

  test('`objShallowEq` returns false for shallowly unequal objects', () => {
    expect(
      objShallowEq({ prop1: 5, prop2: true }, { prop1: 5, prop2: false }),
    ).toBe(false);
  });

  test('`objShallowEq` returns false for deeply equal objects', () => {
    expect(objShallowEq({ prop: [1, 2, 3] }, { prop: [1, 2, 3] })).toBe(false);
  });

  test('`objKeyEq` returns true for empty objects', () => {
    expect(objKeyEq({}, {}, [])).toBe(true);
  });

  test('`objKeyEq` returns false for different objects', () => {
    expect(objKeyEq({ prop1: 5 }, { prop2: 5 }, ['prop1'])).toBe(false);
  });

  test('`objKeyEq` returns true for shallowly equal objects', () => {
    expect(
      objKeyEq({ name: 'betty', age: 5 }, { name: 'betty', age: 10 }, ['name']),
    ).toBe(true);
    expect(
      objKeyEq({ name: 'betty', age: 5 }, { name: 'betty', age: 5 }, [
        'name',
        'age',
      ]),
    ).toBe(true);
  });

  test('`objKeyEq` returns false for shallowly unequal objects', () => {
    expect(
      objKeyEq({ name: 'betty', age: 5 }, { name: 'inez', age: 10 }, ['name']),
    ).toBe(false);
    expect(
      objKeyEq({ name: 'betty', age: 5 }, { name: 'betty', age: 10 }, [
        'name',
        'age',
      ]),
    ).toBe(false);
  });

  test('`objKeyEq` returns true for deeply equal objects', () => {
    expect(
      objKeyEq({ prop: { a: 10, b: 10 } }, { prop: { a: 10, b: 10 } }, [
        'prop.a',
        'prop.b',
      ]),
    ).toBe(true);
  });

  test('`objKeyEq` returns false for deeply unequal objects', () => {
    expect(
      objKeyEq({ prop: { a: 5, b: 5 } }, { prop: { a: 10, b: 10 } }, [
        'prop.a',
        'prop.b',
      ]),
    ).toBe(false);
  });

  test('`objKeyCompare` returns a function correctly', () => {
    expect(objKeyCompare('name')({ name: 'betty' }, { name: 'betty' })).toBe(
      true,
    );
  });

  test('`isEmpty` returns true for empty objects', () => {
    expect(isEmpty({})).toBe(true);
  });

  test('`isEmpty` returns false for non-empty objects', () => {
    expect(isEmpty({ prop: 5 })).toBe(false);
  });
});
