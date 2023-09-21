// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Dimension from 'models/core/wip/Dimension';
import QueryFilterUtil from 'models/core/wip/QueryFilter/QueryFilterUtil';
import { uniqueId } from 'util/util';
import type { Customizable } from 'types/interfaces/Customizable';
import type { Displayable } from 'types/interfaces/Displayable';
import type {
  QueryFilter,
  SerializedQueryFilter,
} from 'models/core/wip/QueryFilter/types';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  dimension: string,

  /**
   * The filter represents how this dimension value should be queried for in
   * the database.
   */
  filter: QueryFilter,

  /**
   * The dimension value ID is a unique, referenceable property that can be
   * used to uniquely represent a dimension value to our system. Unlike the
   * dimension value's "name" property, the value ID must be unique.
   */
  id: string,

  /** This is the common name of the dimension value for display to the user */
  name: string,
};

type DefaultValues = {
  +description: string,
  +subtitle: string,
};

type DerivedValues = {
  searchableText: string,
};

type SerializedDimensionValue = {
  description?: string,
  dimension: string,
  filter: SerializedQueryFilter,
  id: string,
  name: string,
  subtitle?: string,
};

/**
 * The DimensionValue model represents a concrete value for a given dimension in
 * the database and how it can be queried.
 */
class DimensionValue
  extends Zen.BaseModel<
    DimensionValue,
    RequiredValues,
    DefaultValues,
    DerivedValues,
  >
  implements
    Serializable<SerializedDimensionValue>,
    Customizable<DimensionValue>,
    Displayable {
  static defaultValues: DefaultValues = {
    description: '',
    subtitle: '',
  };

  static derivedConfig: Zen.DerivedConfig<DimensionValue, DerivedValues> = {
    searchableText: [
      Zen.hasChanged('name', 'subtitle'),
      (dim: Zen.Model<DimensionValue>) => `${dim.name()} ${dim.subtitle()}`,
    ],
  };

  static deserializeAsync(
    values: SerializedDimensionValue,
  ): Promise<Zen.Model<DimensionValue>> {
    const { description, dimension, filter, id, name, subtitle } = values;
    return QueryFilterUtil.deserializeAsync(filter).then(queryFilter =>
      DimensionValue.create({
        description,
        id,
        name,
        subtitle,
        dimension: Dimension.deserializeToString(dimension),
        filter: queryFilter,
      }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedDimensionValue,
  ): Zen.Model<DimensionValue> {
    const { description, dimension, id, name, subtitle } = values;
    const filter = QueryFilterUtil.UNSAFE_deserialize(values.filter);
    return DimensionValue.create({
      description,
      filter,
      id,
      name,
      subtitle,
      dimension: Dimension.deserializeToString(dimension),
    });
  }

  customize(): Zen.Model<DimensionValue> {
    return this._.id(`${this._.id()}__${uniqueId()}`);
  }

  displayValue(): string {
    return this._.name();
  }

  serialize(): SerializedDimensionValue {
    const { description, id, name, subtitle } = this.modelValues();
    return {
      description,
      id,
      name,
      subtitle,
      dimension: this._.dimension(),
      filter: this._.filter().serialize(),
    };
  }

  // Provide toString() method override since GraphSearchResults unfairly
  // expects all values to be a string or number.
  toString(): string {
    return this._.id();
  }
}

export default ((DimensionValue: $Cast): Class<Zen.Model<DimensionValue>>);
