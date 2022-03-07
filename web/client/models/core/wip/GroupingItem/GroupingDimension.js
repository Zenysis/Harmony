// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Dimension, { getFullDimensionName } from 'models/core/wip/Dimension';
import type { Customizable } from 'types/interfaces/Customizable';
import type { Serializable } from 'lib/Zen';
import type { SerializedDimensionId } from 'models/core/wip/Dimension';

type RequiredValues = {
  dimension: string,
  name: string,
};

type DefaultValues = {
  +includeAll: boolean,
  +includeNull: boolean,
  +includeTotal: boolean,
};

type SerializedGroupingDimension = {
  dimension: string,
  includeAll: boolean,
  includeNull: boolean,
  includeTotal: boolean,
  name: string,
};

export type SerializedGroupingDimensionForQuery = {
  dimension: string,
  includeAll: boolean,
  includeNull: boolean,
  includeTotal: boolean,
};

class GroupingDimension
  extends Zen.BaseModel<GroupingDimension, RequiredValues, DefaultValues>
  implements
    Serializable<SerializedGroupingDimension>,
    Customizable<GroupingDimension> {
  tag: 'GROUPING_DIMENSION' = 'GROUPING_DIMENSION';

  static defaultValues: DefaultValues = {
    includeAll: false,
    includeNull: true,
    includeTotal: false,
  };

  static deserializeAsync(
    values: SerializedGroupingDimension,
  ): Promise<Zen.Model<GroupingDimension>> {
    const { dimension, includeAll, includeNull, includeTotal, name } = values;
    return Promise.resolve(
      GroupingDimension.create({
        includeAll,
        includeNull,
        includeTotal,
        name,
        dimension: Dimension.deserializeToString(dimension),
      }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedGroupingDimension,
  ): Zen.Model<GroupingDimension> {
    const { dimension, includeAll, includeNull, includeTotal, name } = values;
    return GroupingDimension.create({
      includeAll,
      includeNull,
      includeTotal,
      name,
      dimension: Dimension.deserializeToString(dimension),
    });
  }

  static createFromDimension(
    dimension: SerializedDimensionId,
  ): Zen.Model<GroupingDimension> {
    const dimensionId = Dimension.deserializeToString(dimension);
    return GroupingDimension.create({
      dimension: dimensionId,
      name: getFullDimensionName(dimensionId),
    });
  }

  id(): string {
    return this._.dimension();
  }

  serialize(): SerializedGroupingDimension {
    return {
      dimension: this._.dimension(),
      includeAll: this._.includeAll(),
      includeNull: this._.includeNull(),
      includeTotal: this._.includeTotal(),
      name: this._.name(),
    };
  }

  serializeForQuery(): SerializedGroupingDimensionForQuery {
    return {
      dimension: this._.dimension(),
      includeAll: this._.includeAll(),
      includeNull: this._.includeNull(),
      includeTotal: this._.includeTotal(),
    };
  }

  /**
   * Determine if this GroupingDimension will produce the same Query
   * representation as the other GroupingDimension passed in.
   */
  isGroupingDimensionQueryEqual(
    otherDimension: Zen.Model<GroupingDimension>,
  ): boolean {
    return (
      this._ === otherDimension ||
      (this._.dimension() === otherDimension.dimension() &&
        this._.includeAll() === otherDimension.includeAll() &&
        this._.includeNull() === otherDimension.includeNull() &&
        this._.includeTotal() === otherDimension.includeTotal())
    );
  }

  // NOTE(stephen): A unique Dimension can only be added once in the Group By
  // panel, so it is safe to return the exact instance during customization.
  // TODO(stephen): If we add support for per-dimension filtering then we will
  // likely need to support adding a dimension multiple times.
  customize(): Zen.Model<GroupingDimension> {
    return this._;
  }
}

export default ((GroupingDimension: $Cast): Class<
  Zen.Model<GroupingDimension>,
>);
