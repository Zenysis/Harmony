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
  age: number,
  name: string,
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
    const { age, name } = values;
    return Person.create({
      age,
      name: `${name} ${config.someValue}`,
    });
  }

  serialize(): SerializedPerson {
    const { age, name } = this.modelValues();
    return { age, name };
  }
}

export default ((Person: $Cast): Class<Zen.Model<Person>>);
