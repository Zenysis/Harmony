// @flow
import * as Zen from 'lib/Zen';

type Required = {
  name: string,
};

type Optional = {
  livesLeft: Zen.ReadOnly<number>,
};

type Derived = {
  properName: string,
};

class Cat extends Zen.BaseModel<Cat, Required, Optional, Derived> {
  static defaultValues = {
    livesLeft: 9,
  };

  static derivedConfig = {
    properName: [
      Zen.hasChanged<Cat>('name'),
      cat => `Your Royal Highness ${cat.name()}`,
    ],
  };
}

export default ((Cat: any): Class<Zen.Model<Cat>>);
