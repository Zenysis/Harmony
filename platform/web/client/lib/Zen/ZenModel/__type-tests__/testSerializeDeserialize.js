// @flow
/* eslint-disable */
import * as Zen from 'lib/Zen';
import Cat from 'lib/Zen/ZenModel/examples/Cat';
import Person from 'lib/Zen/ZenModel/examples/Person';

/**
 * This file tests serialization and deserialization of models
 */
const p = Person.create({ name: 'test', age: 200 });

// test serialization
const serialized1: { name: string, age: number } = p.serialize();

// test valid deserialization
const p1: Person = Person.deserialize(
  { name: 'lol', age: 200 },
  { someValue: 'test' },
);

// test invalid deserialization: missing DeserializationConfig
// $FlowExpectedError[incompatible-call]
const p2: Person = Person.deserialize({ name: 'lol', age: 200 });

// test invalid deserialization: incorrect serialized type
const p3: Person = Person.deserialize(
  // $FlowExpectedError[incompatible-call]
  { name: 300, age: 200 },
  { someValue: 'test' },
);

// test invalid deserialization: incorrect DeserializationConfig
const p4: Person = Person.deserialize(
  { name: 'name', age: 200 },
  // $FlowExpectedError[incompatible-call]
  { someValue: 300 },
);

// test valid deserialization without a DeserializationConfig
const cat: Cat = Cat.deserialize({ name: 'Meow Meow Fuzzyface', livesLeft: 9 });
