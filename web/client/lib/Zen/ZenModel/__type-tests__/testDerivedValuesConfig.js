// @flow
/* eslint-disable */
import * as Zen from 'lib/Zen';

/**
 * This file tests derived values configurations.
 */

// test valid derivedConfig
class Person extends Zen.BaseModel<
  Person,
  { name: string },
  {},
  { upperCasedName: string },
> {
  static derivedConfig = {
    upperCasedName: [
      (prevPerson, currPerson) => prevPerson.name() !== currPerson.name(),
      p => p.name().toUpperCase(),
    ],
  };
}

// test invalid derivedConfig: empty derivedConfig
class Person1 extends Zen.BaseModel<
  Person,
  { name: string },
  {},
  { upperCasedName: string },
> {
  // $FlowExpectedError[prop-missing]
  static derivedConfig = {};
}

// test invalid derivedConfig: incorrect key
// $FlowExpectedError[prop-missing]
class Person2 extends Zen.BaseModel<
  Person,
  { name: string },
  {},
  { upperCasedName: string },
> {
  // $FlowExpectedError[prop-missing]
  static derivedConfig = {
    wrongKey: [
      (prevPerson, currPerson) => prevPerson.name() !== currPerson.name(),
      p => p.name().toUpperCase(),
    ],
  };
}

// test invalid derivedConfig: derived calculation returns wrong type
// $FlowExpectedError[prop-missing]
class Person3 extends Zen.BaseModel<
  Person,
  { name: string },
  {},
  { upperCasedName: string },
> {
  // $FlowExpectedError[prop-missing]
  static derivedConfig = {
    wrongKey: [
      (prevPerson, currPerson) => prevPerson.name() !== currPerson.name(),
      p => 100,
    ],
  };
}

// test invalid derivedConfig: recomputation boolean calculation does not
// return boolean
// $FlowExpectedError[prop-missing]
class Person4 extends Zen.BaseModel<
  Person,
  { name: string },
  {},
  { upperCasedName: string },
> {
  // $FlowExpectedError[prop-missing]
  static derivedConfig = {
    wrongKey: [(prevPerson, currPerson) => 100, p => 'TEST'],
  };
}
