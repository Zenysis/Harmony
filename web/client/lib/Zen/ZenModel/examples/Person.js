// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  age: number,
};

type DefaultValues = {
  name: string,
};

type DerivedValues = {
  fullName: string,
};

type SerializedPerson = {
  name: string,
  age: number,
};

type DeserializationConfig = {
  someValue: string,
};

class Person
  extends Zen.BaseModel<Person, RequiredValues, DefaultValues, DerivedValues>
  implements Serializable<SerializedPerson, DeserializationConfig> {
  static defaultValues = {
    name: 'hey',
  };

  static derivedConfig = {
    fullName: [
      (prevPerson, currPerson) => prevPerson.name() !== currPerson.name(),
      p => p.name().toUpperCase(),
    ],
  };

  static deserialize(
    values: SerializedPerson,
    config: DeserializationConfig,
  ): Zen.Model<Person> {
    const { name, age } = values;
    return Person.create({
      age,
      name: `${name} ${config.someValue}`,
    });
  }

  serialize(): SerializedPerson {
    const { name, age } = this.modelValues();
    return { name, age };
  }
}

export default ((Person: any): Class<Zen.Model<Person>>);
