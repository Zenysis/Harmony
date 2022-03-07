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
  name: string,
  livesLeft: number,
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

  static deserialize({ name, livesLeft }: SerializedCat): Zen.Model<Cat> {
    return Cat.create({ name, livesLeft });
  }

  serialize(): SerializedCat {
    return {
      name: this._.name(),
      livesLeft: this._.livesLeft(),
    };
  }
}

export default ((Cat: $Cast): Class<Zen.Model<Cat>>);
