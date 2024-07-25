// @flow

/* eslint-disable */
import * as Zen from 'lib/Zen';
import Person from 'lib/Zen/ZenModel/examples/Person';

/**
 * This file tests setting values with deepUpdate on a ZenArray
 */

class Parent extends Zen.BaseModel<
  Parent,
  { name: string, children: Zen.Array<Person> },
> {}
class GrandParent extends Zen.BaseModel<
  GrandParent,
  { name: string, child: Parent },
> {}
class GreatGrandParent extends Zen.BaseModel<
  GreatGrandParent,
  { name: string, child: GrandParent },
> {}

// test deeply nested models
const child1 = Person.create({ name: 'child1', age: 200 });
const child2 = Person.create({ name: 'child2', age: 200 });
const parent = Parent.create({
  name: 'parent',
  children: Zen.Array.create([child1, child2]),
});
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
  .children()
  .map((child, i) => child.name(`${child.name()}_${i}`));
