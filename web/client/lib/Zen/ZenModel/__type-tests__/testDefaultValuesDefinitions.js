// @flow
/* eslint-disable */
import * as Zen from 'lib/Zen';

/**
 * This file tests default value configurations.
 */

// test valid defaultValues definition
class Person extends Zen.BaseModel<Person, { name: string }, { age: number }> {
  static defaultValues = { age: 100 };
}

// test invalid defaultValues: empty defaultValues
class Person1 extends Zen.BaseModel<Person, { name: string }, { age: number }> {
  // $FlowExpectedError[incompatible-extend]
  static defaultValues = {};
}

// test invalid defaultValues: incorrect type in default value
class Person2 extends Zen.BaseModel<Person, { name: string }, { age: number }> {
  // $FlowExpectedError[incompatible-extend]
  static defaultValues = {
    age: 'test',
  };
}

// test invalid defaultValues: incorrect key in defaultValues object
class Person3 extends Zen.BaseModel<Person, { name: string }, { age: number }> {
  // $FlowExpectedError[incompatible-extend]
  static defaultValues = {
    wrongKey: 100,
  };
}

// test invalid defaultValues: defaultValues are missing
// TODO(pablo): this is a known bug in our ZenModel type definitions. This
// should raise a type error but it does not. One day hopefully we can fix
// this test.
class Person4 extends Zen.BaseModel<
  Person,
  { name: string },
  { age: number },
> {}
