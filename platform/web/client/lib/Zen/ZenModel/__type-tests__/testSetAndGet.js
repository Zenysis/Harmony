// @flow
/* eslint-disable */
import * as Zen from 'lib/Zen';
import Person from 'lib/Zen/ZenModel/examples/Person';

/**
 * This file tests basic set and get calls to ensure they type-check
 * correctly.
 */
const p = Person.create({ name: 'test', age: 200 });

// test valid getter (required value)
const name1: string = p.get('name');
const name2: string = p.name();

// test valid getter (default value)
const age1: number = p.get('age');
const age2: number = p.age();

// test valid getter (derived value)
const derivedName1: string = p.get('upperCasedName');
const derivedName2: string = p.upperCasedName();

// test valid setter (required value)
const p1: Person = p.set('name', 'test2');
const p2: Person = p.name('test2');

// test valid setter (default value)
const p3: Person = p.set('age', 100);
const p4: Person = p.age(100);

// test invalid getter: wrong key
// $FlowExpectedError[incompatible-call]
const wrongName: string = p.get('namez');
// $FlowExpectedError[incompatible-call]
const wrongName2: string = p.namez();

// test invalid getter: wrong type return (required value)
// $FlowExpectedError[incompatible-type]
const wrongName3: number = p.get('name');
// $FlowExpectedError[incompatible-type]
const wrongName4: number = p.name();

// test invalid getter: wrong type return (default value)
// $FlowExpectedError[incompatible-type]
const wrongAge1: string = p.get('age');
// $FlowExpectedError[incompatible-type]
const wrongAge2: string = p.age();

// test invalid setter: wrong key
// $FlowExpectedError[incompatible-call]
const p5 = p.set('namez', 'test');
// $FlowExpectedError[incompatible-call]
const p6 = p.namez('test');

// test invalid setter: cannot set a derived value
// $FlowExpectedError[incompatible-call]
const p7 = p.set('upperCaseName', 'test');
// $FlowExpectedError[incompatible-call]
const p8 = p.upperCaseName('test');

// test invalid setter: correct key, but value is of wrong type
// $FlowExpectedError[incompatible-call]
const p9 = p.set('name', 100);
// $FlowExpectedError[incompatible-call]
const p10 = p.name(100);

// test invalid setter: wrong return type (should be a model instance)
// $FlowExpectedError[incompatible-type]
const p11: string = p.set('name', 'test');
// $FlowExpectedError[incompatible-type]
const p12: string = p.name('test');

// test getting all values through .modelValues()
const vals1 = p.modelValues();
(vals1: {
  name: string,
  age: number,
  upperCasedName: string,
});

// test destructuring with .modelValues()
const { name, age, upperCasedName } = p.modelValues();
(name: string);
(age: number);
(upperCasedName: string);

// test setting values with .modelValues()
const p13: Person = p.modelValues({ name: 'test', age: 200 });

// test setting values with .modelValues() - only pass a subset of values
const p14: Person = p.modelValues({ age: 200 });

// invalid .modelValues(): cannot set a derived value
// $FlowExpectedError[incompatible-call]
const p15: Person = p.modelValues({
  name: 'test',
  age: 200,
  upperCasedName: 'hey',
});
