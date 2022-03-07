// @flow
/* eslint-disable max-classes-per-file */
import ZenModel from 'lib/Zen/ZenModel';
import { statefulCompute } from 'lib/Zen/ZenModel/coreHelpers';
import type { AnyModel, Model } from 'lib/Zen/ZenModel';

const TEST_NAME = 'Starting Name';
const TEST_AGE = 200;

// Person class we will use for most tests
class Person extends ZenModel<
  Person,
  { name: string },
  { age: number },
  { upperCaseName: string, lowerCaseName: string, doubledAge: number },
> {
  someInstanceValue = 'someInstanceValue';

  static defaultValues = {
    age: 100,
  };

  static derivedConfig = {
    upperCaseName: [
      (prevPerson, currPerson) => prevPerson.name() !== currPerson.name(),
      p => p.name().toUpperCase(),
    ],
    lowerCaseName: [
      (prevPerson, currPerson) => prevPerson.name() !== currPerson.name(),
      p => p.name().toLowerCase(),
    ],
    doubledAge: [
      (prevPerson, currPerson) => prevPerson.age() !== currPerson.age(),
      p => p.age() * 2,
    ],
  };
}

// Person class that has a stateful derived value
class TestPerson2 extends ZenModel<
  TestPerson2,
  { name: string },
  {},
  { allNames: $ReadOnlyArray<string> },
> {
  static derivedConfig = {
    // every time we change this person's name, we append the new name to the
    // end of the array
    allNames: [
      (prevPerson, currPerson) => prevPerson.name() !== currPerson.name(),
      statefulCompute<$ReadOnlyArray<string>, TestPerson2>((p, prevPerson) =>
        prevPerson === undefined
          ? [p.name()]
          : prevPerson.allNames().concat(p.name()),
      ),
    ],
  };
}

// test class that has nested models, so we can test `deepUpdate` calls
class ParentPerson extends ZenModel<
  ParentPerson,
  { name: string, child: Model<Person> },
> {}

const person = Person.create({ name: TEST_NAME, age: TEST_AGE });

/**
 * Utility function that returns all the derived values from a model
 */
function derivedValuesCompute(model: AnyModel) {
  const derivedVals = {};
  Object.keys(Person.derivedConfig).forEach(key => {
    const computeFn = model.constructor.derivedConfig[key][1];
    derivedVals[key] = computeFn(model);
  });
  return derivedVals;
}

describe('ZenModel', () => {
  test('Model that has no `static defaultValues` is set up correctly', () => {
    class MyModel extends ZenModel<MyModel, { name: string, age: number }> {}
    const vals = { name: TEST_NAME, age: TEST_AGE };
    expect(MyModel.create(vals).modelValues()).toEqual(vals);
  });

  test('.get(key) gets the correct value', () => {
    expect(person.get('name')).toBe(TEST_NAME);
    expect(person.get('age')).toBe(TEST_AGE);
  });

  test('.[key]() gets the correct value', () => {
    expect(person.name()).toBe(TEST_NAME);
    expect(person.age()).toBe(TEST_AGE);
  });

  test('.set(key, val) creates a new instance', () => {
    const newPerson1 = person.set('name', 'NewName');
    expect(newPerson1).not.toBe(person);

    // ensure we can set more than once
    const newPerson2 = person.set('age', 100);
    expect(newPerson2).not.toBe(newPerson1);
  });

  test('.set(key, val) sets the value correctly', () => {
    const newPerson = person.set('name', 'NewName');
    expect(newPerson.get('name')).toBe('NewName');

    // ensure we can set more than once
    const newPerson2 = person.set('age', 100);
    expect(newPerson2.get('age')).toBe(100);

    // ensure original values were not changed
    expect(person.name()).toBe(TEST_NAME);
    expect(person.age()).toBe(TEST_AGE);
  });

  test('.[key](val) creates a new instance', () => {
    const newPerson1 = person.name('NewName');
    expect(newPerson1).not.toBe(person);

    // ensure we can set more than once
    const newPerson2 = person.age(100);
    expect(newPerson2).not.toBe(newPerson1);
  });

  test('.[key](val) sets the value correctly', () => {
    const newPerson = person.name('NewName');
    expect(newPerson.name()).toBe('NewName');

    // ensure we can set more than once
    const newPerson2 = person.age(100);
    expect(newPerson2.age()).toBe(100);

    // ensure original values were not changed
    expect(person.name()).toBe(TEST_NAME);
    expect(person.age()).toBe(TEST_AGE);
  });

  test('.modelValues() returns correct values', () => {
    const derivedVals = derivedValuesCompute(person);
    expect(person.modelValues()).toEqual({
      name: TEST_NAME,
      age: TEST_AGE,
      ...derivedVals,
    });
  });

  test('.modelValues(null) does nothing and returns the unchanged model instance', () => {
    // $FlowExpectedError[incompatible-call]
    expect(person.modelValues(null)).toBe(person);
  });

  test('.modelValues(undefined) does nothing and returns the unchanged model instance', () => {
    // $FlowExpectedError[incompatible-call]
    expect(person.modelValues(undefined)).toBe(person);
  });

  test('.modelValues(vals) creates a new instance', () => {
    const newPerson = person.modelValues({ name: 'NewName', age: 100 });
    expect(newPerson).not.toBe(person);
  });

  test('.modelValues(vals) sets all values correctly', () => {
    const newPerson = person.modelValues({ name: 'NewName', age: 100 });
    const newDerivedVals = derivedValuesCompute(newPerson);
    expect(newPerson.modelValues()).toEqual({
      name: 'NewName',
      age: 100,
      ...newDerivedVals,
    });

    // ensure original values were not changed
    const originalDerivedVals = derivedValuesCompute(person);
    expect(person.modelValues()).toEqual({
      name: TEST_NAME,
      age: TEST_AGE,
      ...originalDerivedVals,
    });
  });

  test('Model is created with correct auto-filled default values', () => {
    class Test extends ZenModel<Test, {}, { name: string, age: number }> {
      static defaultValues = {
        name: 'test name',
        age: 100,
      };
    }
    expect(Test.create({}).modelValues()).toEqual(Test.defaultValues);
  });

  test('Model is created with correct user-specified default values', () => {
    class Test extends ZenModel<Test, {}, { name: string, age: number }> {
      static defaultValues = {
        name: 'test name',
        age: 100,
      };
    }
    const vals = { name: TEST_NAME, age: 200 };
    expect(Test.create(vals).modelValues()).toEqual(vals);
  });

  test('Model has correct derived values on initialization', () => {
    const derivedVals = derivedValuesCompute(person);
    expect(person.modelValues()).toMatchObject(derivedVals);
  });

  test('Model has correct derived values after updating dependent value', () => {
    const newPerson = person.name('NewName');
    const derivedVals = derivedValuesCompute(newPerson);
    expect(newPerson.modelValues()).toMatchObject(derivedVals);
  });

  test('Throws error if model is initialized with a derived value in .create()', () => {
    expect(() => {
      class TestModel extends ZenModel<
        TestModel,
        { name: string },
        {},
        { upperCaseName: string },
      > {
        static derivedConfig = {
          upperCaseName: [() => true, model => model.name().toUpperCase()],
        };
      }

      // $FlowExpectedError[prop-missing]
      TestModel.create({ name: 'test', upperCaseName: 'TEST' });
    }).toThrowError();
  });

  test('Throws error when trying to set a derived value', () => {
    expect(() => {
      // $FlowExpectedError[incompatible-call]
      person.upperCaseName('New Name');
    }).toThrowError();
  });

  test('classDisplayName() gets the `static displayName`', () => {
    class TestModel extends ZenModel<TestModel, {}> {
      static displayName = 'SomeModel';
    }
    expect(TestModel.classDisplayName()).toBe('SomeModel');
  });

  test('derived value with `statefulCompute` is calculated correctly on initialization', () => {
    const p = TestPerson2.create({ name: TEST_NAME });
    expect(p.allNames()).toEqual([TEST_NAME]);
  });

  test('derived value with `statefulCompute` is calculated correctly after an update', () => {
    const p = TestPerson2.create({ name: TEST_NAME }).name('NewName');
    expect(p.allNames()).toEqual([TEST_NAME, 'NewName']);
  });

  test('.deepUpdate() setter updates non-nested value', () => {
    const parent = ParentPerson.create({ name: 'p1', child: person });

    // calling deepUpdate for one of the parent's values, not the nested child
    const newParent = parent.deepUpdate().name('test');
    expect(newParent.name()).toBe('test');
  });

  test('.deepUpdate() setter updates nested value correctly', () => {
    const parent = ParentPerson.create({ name: 'p1', child: person });

    // calling deepUpdate for the child's value
    const newParent = parent
      .deepUpdate()
      .child()
      .name('test');
    expect(newParent.child().name()).toBe('test');
  });

  test('.deepUpdate() creates a new instance of the parent instance', () => {
    const parent = ParentPerson.create({ name: 'p1', child: person });
    const newParent = parent
      .deepUpdate()
      .child()
      .name('test');
    expect(newParent).toBeInstanceOf(ParentPerson);
    expect(newParent).not.toBe(parent);
  });

  test('.deepUpdate() creates a new instance of the child instance', () => {
    const parent = ParentPerson.create({ name: 'p1', child: person });
    const newParent = parent
      .deepUpdate()
      .child()
      .name('test');
    expect(newParent.child()).toBeInstanceOf(Person);
    expect(newParent.child()).not.toBe(person);
  });

  test('.deepUpdate() throw error when calling a non-functional getter', () => {
    const parent = ParentPerson.create({ name: 'p1', child: person });
    expect(() => {
      // $FlowExpectedError[incompatible-use]
      const val = parent.deepUpdate().child().someInstanceValue; // eslint-disable-line
    }).toThrowError();
  });
});
