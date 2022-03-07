// @flow
/* eslint-disable */
import * as Zen from 'lib/Zen';
import Dog from 'lib/Zen/ZenModel/examples/Dog';
import Person from 'lib/Zen/ZenModel/examples/Person';

/**
 * This file tests set/get calls with union types.
 */
const p = Person.create({ name: 'test', age: 200 });

// test valid getter with a union key
const key: 'age' | 'name' = 'name';
const val1 = p.get(key);
(val1: number | string); // no error

const val2 = p.get(key);
// $FlowExpectedError[incompatible-cast] - we assert against just 'number' and that's wrong
(val2: number);

// test valid setter with a union value
class TestModel extends Zen.BaseModel<TestModel, { val: number | string }> {}
const t = TestModel.create({ val: 'test' });
const t1 = t.val(100);
const t2 = t.val('test2');

// test getter from a union of models with the same value
type ModelUnion = Dog | Person;
const model: ModelUnion = Dog.create({ name: 'Luna' });
const name1: string = model.get('name');

// $FlowExpectedError[incompatible-call] - This should be fine!! But flow is angry about it :(
const name2: string = model.name();
