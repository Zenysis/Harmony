// @flow
import ZenModel from 'lib/Zen/ZenModel';
import { hasChanged, hasChangedDeep } from 'lib/Zen/ZenModel/coreHelpers';

describe('ZenModel core helpers', () => {
  test("`hasChanged` correctly checks if a model's value has changed", () => {
    class Person extends ZenModel<Person, { name: string }> {}
    const p1 = Person.create({ name: 'test' });
    const p2 = p1.name('test2');
    expect(hasChanged('name')(p1, p2)).toBe(true);
  });

  test("`hasChanged` correctly checks if a model's value is the same", () => {
    class Person extends ZenModel<Person, { name: string, age: number }> {}
    const p1 = Person.create({ name: 'test', age: 100 });
    const p2 = p1.age(200);

    // This should return false because 'name' did not change, only 'age' did
    expect(hasChanged('name')(p1, p2)).toBe(false);
  });

  test("`hasChangedDeep` correctly checks if a model's nested value has changed", () => {
    class Person extends ZenModel<Person, { name: string }> {}
    class Parent extends ZenModel<Parent, { child: Person }> {}
    const parent1 = Parent.create({ child: Person.create({ name: 'test' }) });
    const parent2 = parent1
      .deepUpdate()
      .child()
      .name('test2');
    expect(hasChangedDeep('child.name')(parent1, parent2)).toBe(true);
  });

  test("`hasChangedDeep` correctly checks if a model's nested value has not changed", () => {
    class Person extends ZenModel<Person, { name: string, age: number }> {}
    class Parent extends ZenModel<Parent, { child: Person }> {}
    const parent1 = Parent.create({
      child: Person.create({ name: 'test', age: 100 }),
    });
    const parent2 = parent1
      .deepUpdate()
      .child()
      .age(200);

    // This should return false because 'name' did not change, only 'age' did
    expect(hasChangedDeep('child.name')(parent1, parent2)).toBe(false);
  });
});
