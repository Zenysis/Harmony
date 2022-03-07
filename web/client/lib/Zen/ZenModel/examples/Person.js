// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  name: string,
};

type DefaultValues = {
  +age: number,
};

type DerivedValues = {
  upperCasedName: string,
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
  static defaultValues: DefaultValues = {
    age: 100,
  };

  static derivedConfig: Zen.DerivedConfig<Person, DerivedValues> = {
    upperCasedName: [
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

export default ((Person: $Cast): Class<Zen.Model<Person>>);
