// @flow
import ZenModel from 'lib/Zen/ZenModel';
import ZenModelUtil from 'lib/Zen/ZenModel/ZenModelUtil';

// Set up test model class
class Person extends ZenModel<Person, { name: string }> {}

const p1 = Person.create({ name: 'pablo' });
const p2 = Person.create({ name: 'moriah' });
const p3 = Person.create({ name: 'stephen' });

const PERSON_ARRAY = [p1, p2, p3];

describe('ZenModelUtil', () => {
  test('Array of models gets converted to object with string accessor', () => {
    const expectedObjects = {
      pablo: p1,
      moriah: p2,
      stephen: p3,
    };
    expect(ZenModelUtil.modelArrayToObject(PERSON_ARRAY, 'name')).toEqual(
      expectedObjects,
    );
  });

  test('Array of models gets converted to object with functional accessor', () => {
    const expectedObjects = {
      PABLO: p1,
      MORIAH: p2,
      STEPHEN: p3,
    };
    const accessor = (person: Person) => person.get('name').toUpperCase();
    expect(ZenModelUtil.modelArrayToObject(PERSON_ARRAY, accessor)).toEqual(
      expectedObjects,
    );
  });

  test('modelArrayToObject throws error with invalid accessor', () => {
    expect(() => {
      // $FlowExpectedError[incompatible-call]
      ZenModelUtil.modelArrayToObject(PERSON_ARRAY, 100);
    }).toThrowError();
  });
});
