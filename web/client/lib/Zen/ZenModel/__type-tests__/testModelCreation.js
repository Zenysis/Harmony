// @flow
/* eslint-disable */
import * as Zen from 'lib/Zen';
import Person from 'lib/Zen/ZenModel/examples/Person';

/**
 * This file tests model creation to ensure it type-checks correctly.
 */

// test creation with an empty object when values are expected
// $FlowExpectedError[prop-missing]
const emptyPerson: Person = Person.create({});

// test creation with no argument
// $FlowExpectedError[incompatible-call]
const p1: Person = Person.create();

// test creation with an empty object for a model that has no required values
class TestModel extends Zen.BaseModel<TestModel, {}, { name: string }> {
  static defaultValues = { name: 'test' };
}
const t1 = TestModel.create({}); // no error!

// test valid creation for an object:
// 1. forgetting a default value should give no error
// 2. Supplying all required and default values should give no error
const p2: Person = Person.create({ name: 'test' });
const p3: Person = Person.create({ name: 'test', age: 200 });

// test invalid creation: required value has wrong type
// $FlowExpectedError[incompatible-call]
const p4: Person = Person.create({ name: 100 });

// test invalid creation: default value has wrong type
// $FlowExpectedError[incompatible-call]
const p5: Person = Person.create({ name: 'test', age: '200' });

// test invalid creation: required value was forgotten
// $FlowExpectedError[prop-missing]
const p6: Person = Person.create({ age: 100 });
