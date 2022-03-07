// @flow
import ZenArray from 'lib/Zen/ZenArray';
import ZenMap from 'lib/Zen/ZenMap';
import ZenModel from 'lib/Zen/ZenModel';
import {
  deserializeArray,
  deserializeMap,
  deserializeToZenArray,
  deserializeToZenMap,
  serializeArray,
  serializeMap,
} from 'lib/Zen/util/serializationUtil';
import type { Model } from 'lib/Zen/ZenModel';
import type { Serializable } from 'lib/Zen/util/serializationUtil';

type SerializedPerson = { name: string };
type DeserializationConfig = { suffix: string };

class Person extends ZenModel<Person, { name: string }>
  implements Serializable<SerializedPerson, DeserializationConfig> {
  static deserialize(
    vals: SerializedPerson,
    config: DeserializationConfig,
  ): Model<Person> {
    return Person.create({ name: `${vals.name} ${config.suffix}` });
  }

  serialize(): SerializedPerson {
    return this.modelValues();
  }
}

describe('ZenModel serialization', () => {
  test('`serializeArray` serializes a ZenArray of models', () => {
    const arr = ZenArray.create([
      Person.create({ name: 'p1' }),
      Person.create({ name: 'p2' }),
    ]);
    expect(serializeArray(arr)).toEqual([{ name: 'p1' }, { name: 'p2' }]);
  });

  test('`serializeArray` serializes an array of models', () => {
    const arr = [Person.create({ name: 'p1' }), Person.create({ name: 'p2' })];
    expect(serializeArray(arr)).toEqual([{ name: 'p1' }, { name: 'p2' }]);
  });

  test('`serializeMap` serializes a ZenMap of models', () => {
    const map = ZenMap.create({
      p1: Person.create({ name: 'p1' }),
      p2: Person.create({ name: 'p2' }),
    });
    expect(serializeMap(map)).toEqual({
      p1: { name: 'p1' },
      p2: { name: 'p2' },
    });
  });

  test('`serializeMap` serializes an object of models', () => {
    const map = {
      p1: Person.create({ name: 'p1' }),
      p2: Person.create({ name: 'p2' }),
    };
    expect(serializeMap(map)).toEqual({
      p1: { name: 'p1' },
      p2: { name: 'p2' },
    });
  });
});

describe('ZenModel deserialization', () => {
  test('`deserializeArray` deserializes an array of serialized models', () => {
    const arr = [{ name: 'p1' }, { name: 'p2' }];

    expect(deserializeArray(Person, arr, { suffix: 'III' })).toEqual([
      Person.create({ name: 'p1 III' }),
      Person.create({ name: 'p2 III' }),
    ]);
  });

  test('`deserializeToZenArray` deserializes an array of serialized models to a ZenArray', () => {
    const arr = [{ name: 'p1' }, { name: 'p2' }];
    expect(deserializeToZenArray(Person, arr, { suffix: 'III' })).toEqual(
      ZenArray.create([
        Person.create({ name: 'p1 III' }),
        Person.create({ name: 'p2 III' }),
      ]),
    );
  });

  test('`deserializeMap` deserializes an object of serialized models', () => {
    const obj = {
      p1: { name: 'p1' },
      p2: { name: 'p2' },
    };
    expect(deserializeMap(Person, obj, { suffix: 'III' })).toEqual({
      p1: Person.create({ name: 'p1 III' }),
      p2: Person.create({ name: 'p2 III' }),
    });
  });

  test('`deserializeMap` deserializes an object of serialized models to a ZenMap', () => {
    const obj = {
      p1: { name: 'p1' },
      p2: { name: 'p2' },
    };
    expect(deserializeToZenMap(Person, obj, { suffix: 'III' })).toEqual(
      ZenMap.create({
        p1: Person.create({ name: 'p1 III' }),
        p2: Person.create({ name: 'p2 III' }),
      }),
    );
  });
});
