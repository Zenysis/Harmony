// @flow
import * as Zen from 'lib/Zen';

type Required = {
  name: string,
};

type Optional = {
  dogdad: string,
};

class Dog extends Zen.BaseModel<Dog, Required, Optional> {
  static defaultValues = {
    dogdad: 'Pablo',
  };

  speak(): string {
    return `I'm ${this._.name()} and ${this._.dogdad()} is my dad.`;
  }
}

export default ((Dog: any): Class<Zen.Model<Dog>>);
