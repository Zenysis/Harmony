// @flow
import * as Zen from 'lib/Zen';
import DimensionService from 'services/wip/DimensionService';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import type { JSONRef } from 'services/types/api';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  id: string,
  name: string,
};

type DefaultValues = {
  category: Zen.ReadOnly<LinkedCategory | void>,
  description: string,
};

export type SerializedDimension = JSONRef;

/**
 * The Dimension model represents how a database dimension should be
 * represented.
 */
class Dimension extends Zen.BaseModel<Dimension, RequiredValues, DefaultValues>
  implements Serializable<SerializedDimension> {
  static defaultValues = {
    category: undefined,
    description: '',
  };

  static deserializeAsync(
    values: SerializedDimension,
  ): Promise<Zen.Model<Dimension>> {
    return DimensionService.get(DimensionService.convertURIToID(values.$ref));
  }

  static UNSAFE_deserialize(values: SerializedDimension): Zen.Model<Dimension> {
    return DimensionService.UNSAFE_get(
      DimensionService.convertURIToID(values.$ref),
    );
  }

  serialize(): SerializedDimension {
    return {
      $ref: DimensionService.convertIDToURI(this._.id()),
    };
  }
}

export default ((Dimension: any): Class<Zen.Model<Dimension>>);
