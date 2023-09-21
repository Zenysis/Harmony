// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  name: string,
};

type DefaultValues = {
  +livesLeft: number,
};

type DerivedValues = {
  properName: string,
};

type SerializedCat = {
  livesLeft: number,
  name: string,
};

class Cat
  extends Zen.BaseModel<Cat, RequiredValues, DefaultValues, DerivedValues>
  implements Serializable<SerializedCat> {
  static defaultValues: DefaultValues = {
    livesLeft: 9,
  };

  static derivedConfig: Zen.DerivedConfig<Cat, DerivedValues> = {
    properName: [
      Zen.hasChanged<Cat>('name'),
      cat => `Their Royal Highness ${cat.name()}`,
    ],
  };

  static deserialize({ livesLeft, name }: SerializedCat): Zen.Model<Cat> {
    return Cat.create({ livesLeft, name });
  }

  serialize(): SerializedCat {
    return {
      livesLeft: this._.livesLeft(),
      name: this._.name(),
    };
  }
}

export default ((Cat: $Cast): Class<Zen.Model<Cat>>);
