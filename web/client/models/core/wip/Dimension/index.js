// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
// no way to avoid this circular dependency unfortunately
// eslint-disable-next-line import/no-cycle
import DimensionService from 'services/wip/DimensionService';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type { JSONRef } from 'services/types/api';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  id: string,
  name: string,
};

type DefaultValues = {
  +category: LinkedCategory | void,
  +description: string,
};

// We are supporting two types here while we transition calculations and filters
// from storing the entire dimension object to just the dimension id string.
// TODO(yitian): Remove the JSONRef type after 12/2020.
export type SerializedDimensionId = JSONRef | string;

export type SerializedDimension = JSONRef;

// NOTE(stephen): Very small tweak to Dimension deserialization as we begin
// moving things into GraphQL. This will allow us to deserialize calculations
// and filters that have the full, non-ref version of a dimension stored. As we
// move more things to GraphQL, we can remove the $ref style deserialization.
type DeserializableDimension =
  | SerializedDimension
  | { id: string, name: string };

// HACK(stephen): The backend doesn't know what language we need to show for
// the dimension. Use this specific translation path (which has been widely
// overused and not cared for) to get the value.
// TODO(stephen): Consolidate this usage.
const DIMENSION_NAME_TEXT = t('select_granularity');

// Build a translated dimension name if possible.
export function getFullDimensionName(
  dimensionId: string,
  currentName: string = '',
): string {
  if (currentName.length > 0 && currentName !== dimensionId) {
    return currentName;
  }

  return DIMENSION_NAME_TEXT[dimensionId] || dimensionId;
}

/**
 * The Dimension model represents how a database dimension should be
 * represented.
 */
class Dimension extends Zen.BaseModel<Dimension, RequiredValues, DefaultValues>
  implements Serializable<SerializedDimension> {
  tag: 'DIMENSION' = 'DIMENSION';

  static defaultValues: DefaultValues = {
    category: undefined,
    description: '',
  };

  static fromObject({
    category,
    description,
    id,
    name,
  }: {
    ...RequiredValues,
    ...$Rest<DefaultValues, { ... }>,
  }): Zen.Model<Dimension> {
    return Dimension.create({
      category,
      description,
      id,
      name: getFullDimensionName(id, name),
    });
  }

  static deserializeAsync(
    values: DeserializableDimension,
  ): Promise<Zen.Model<Dimension>> {
    if (values.id !== undefined && values.name !== undefined) {
      const { id, name } = values;
      return Promise.resolve(Dimension.fromObject({ id, name }));
    }

    return DimensionService.forceGet(
      DimensionService.convertURIToID(values.$ref),
    );
  }

  static UNSAFE_deserialize(
    values: DeserializableDimension,
  ): Zen.Model<Dimension> {
    if (values.id !== undefined && values.name !== undefined) {
      const { id, name } = values;
      return Dimension.fromObject({ id, name });
    }

    return DimensionService.UNSAFE_forceGet(
      DimensionService.convertURIToID(values.$ref),
    );
  }

  // Deserialize a dimension object to its id. The inputs will either be a
  // json ref object where we will retrieve the id from the ref or the id itself.
  static deserializeToString(dimension: SerializedDimensionId): string {
    return typeof dimension === 'string'
      ? dimension
      : DimensionService.convertURIToID(dimension.$ref);
  }

  serialize(): SerializedDimension {
    return {
      $ref: DimensionService.convertIDToURI(this._.id()),
    };
  }
}

export default ((Dimension: $Cast): Class<Zen.Model<Dimension>>);
