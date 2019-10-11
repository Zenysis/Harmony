// @flow
/* eslint-disable */
import * as Zen from 'lib/Zen';
import Person from 'lib/Zen/ZenModel/examples/Person';

// Test model creation:
//   1. empty object (expect error)
// Test defaults:
//   1. forget a default (no error)
//   2. mis-type a default (expect error)
//   3. pass default correctly (no error)
// Test required:
//   1. forget a required prop (expect error)
//   2. mis-type a required prop (expect error)
//   3. pass required correctly (no error)

// $ExpectError
const emptyPerson: Person = Person.create({});

let p = Person.create({ age: 4 });

// $ExpectError
p = Person.create({ age: 4, name: 3 });
p = Person.create({ age: 4, name: 'hiii' });

// $ExpectError
p = Person.create({ name: 'hiiii' });

// $ExpectError
p = Person.create({ age: 'ageee', name: 'hiiii' });
p = Person.create({ age: 4, name: 'hiiii' });

// Test getting and setting values
let p1: Person = Person.create({ age: 4 });
const name: string = p1.get('name');
const name2: string = p1.name();

let p2 = p1.set('name', 'hey');
p2 = p1.name('lolol');
const full = p1.fullName();

// $ExpectError
p2 = p2.name(null);

p2 = p1.deepUpdate().name('hey');

// Test serialization and deserialization
const serialized: Zen.Serialized<Person> = p2.serialize();

const deserializedPerson: Person = Person.deserialize(
  { name: 'lol', age: 100 },
  { someValue: 'lol' },
);

// Test getters with multiple keys
const key: 'age' | 'name' = 'name';
const validVal = p2.get(key);

// $ExpectError - the type should be `number | string`
(validVal: number);

// Test derivedConfig (it should not allow invalid arguments)
const shouldComputeFullNameFn = Person.derivedConfig.fullName[0];

// $ExpectError - the updater function should expect Person models.
const shouldComputeFullName = shouldComputeFullNameFn(4, 'asdf');
