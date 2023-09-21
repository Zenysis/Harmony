// @flow
/* eslint-disable */
import * as Zen from 'lib/Zen';
import Person from 'lib/Zen/ZenModel/examples/Person';

/**
 * This file tests setting values with deepUpdate
 */

class Parent extends Zen.BaseModel<Parent, { name: string, child: Person }> {}
class GrandParent extends Zen.BaseModel<
  GrandParent,
  { name: string, child: Parent },
> {}
class GreatGrandParent extends Zen.BaseModel<
  GreatGrandParent,
  { name: string, child: GrandParent },
> {}

const child = Person.create({ name: 'child', age: 200 });
const p = Parent.create({ name: 'parent', child });

// test getting a nested value
const name: string = p.child().name();

// test setting a nested value
const child1: Person = p.child().name('test');

// test invalid setting of a nested value: wrong return type, expect model
// instance, not the value's type
// $FlowExpectedError[incompatible-type]
const child2: string = p.child().name('test');

// test setting with .deepUpdate()
const p1: Parent = p
  .deepUpdate()
  .child()
  .name('new child name');

const p2: Parent = p.deepUpdate().name('new parent name');

// test invalid setting with .deepUpdate(): expect model instance,
// not the value's type
// $FlowExpectedError[incompatible-type]
const p3: string = p
  .deepUpdate()
  .child()
  .name('child');

// test deeply nested models
const lastChild = Person.create({ name: 'child', age: 200 });
const parent = Parent.create({ name: 'parent', child: lastChild });
const grandparent = GrandParent.create({
  name: 'grandparent',
  child: parent,
});
const greatGrandparent = GreatGrandParent.create({
  name: 'great grandparent',
  child: grandparent,
});

// test setting a value on a deeply nested model
const newGreatGrandparent: Zen.Model<GreatGrandParent> = greatGrandparent
  .deepUpdate()
  .child()
  .child()
  .child()
  .name('new child');
