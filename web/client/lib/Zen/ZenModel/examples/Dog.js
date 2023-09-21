// @flow
import * as Zen from 'lib/Zen';

type RequiredValues = {
  name: string,
};

type DefaultValues = {
  +dogdad: string,
};

class Dog extends Zen.BaseModel<Dog, RequiredValues, DefaultValues> {
  static defaultValues: DefaultValues = {
    dogdad: 'Pablo',
  };

  speak(): string {
    return `I'm ${this._.name()} and ${this._.dogdad()} is my dad.`;
  }
}

export default ((Dog: $Cast): Class<Zen.Model<Dog>>);
