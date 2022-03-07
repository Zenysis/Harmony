// @flow
import * as Zen from 'lib/Zen';
import Dataset from 'models/core/wip/Dataset';
import Dimension from 'models/core/wip/Dimension';
// No way to avoid this circular dependency unfortunately.
// eslint-disable-next-line import/no-cycle
import FieldMetadataService from 'services/wip/FieldMetadataService';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import type { JSONRef } from 'services/types/api';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  category: LinkedCategory,
  dimensions: $ReadOnlyArray<Dimension>,
  id: string,
  source: Dataset,
};

type DefaultValues = {
  +constituentIds: $ReadOnlyArray<string>,
  +description: string,
};

type SerializedFieldMetadata = JSONRef;

class FieldMetadata
  extends Zen.BaseModel<FieldMetadata, RequiredValues, DefaultValues>
  implements Serializable<SerializedFieldMetadata> {
  static defaultValues: DefaultValues = {
    constituentIds: [],
    description: '',
  };

  static deserializeAsync(
    values: SerializedFieldMetadata,
  ): Promise<Zen.Model<FieldMetadata>> {
    // NOTE(stephen): Preferring the `.get` method versus `.forceGet` since we
    // want to provide a default value if one does not exist in the cache.
    // Right now, it's better to fulfill any FieldMetadata deserialization
    // request than to raise an invariant.
    return FieldMetadataService.get(
      FieldMetadataService.convertURIToID(values.$ref),
    ).then(
      (metadata: Zen.Model<FieldMetadata> | void) =>
        metadata || FieldMetadataService.getDefault(),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedFieldMetadata,
  ): Zen.Model<FieldMetadata> {
    return (
      FieldMetadataService.UNSAFE_get(
        FieldMetadataService.convertURIToID(values.$ref),
      ) || FieldMetadataService.getDefault()
    );
  }

  // Instead of destructuring like in Field, we want to just store the ref.
  // This is because the category, source, and dimensions can change behind
  // the scenes. So if we store direct serialized properties, and
  // they change, then we'll be internally pointing to references that don't
  // exist anymore. Just storing the ref to the whole FieldMetadata allows us
  // to always retrieve the most recent category, source, and dimensions.
  serialize(): SerializedFieldMetadata {
    return {
      $ref: FieldMetadataService.convertIDToURI(this._.id()),
    };
  }
}

export default ((FieldMetadata: $Cast): Class<Zen.Model<FieldMetadata>>);
