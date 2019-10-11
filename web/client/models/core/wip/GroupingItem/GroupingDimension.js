// @flow
import * as Zen from 'lib/Zen';
import Dimension from 'models/core/wip/Dimension';
import type { Customizable } from 'types/interfaces/Customizable';
import type { Serializable } from 'lib/Zen';
import type { SerializedDimension } from 'models/core/wip/Dimension';

type RequiredValues = {
  dimension: Dimension,
  name: string,
};

type DefaultValues = {
  includeNull: boolean,
  includeTotal: boolean,
};

type SerializedGroupingDimension = {
  dimension: SerializedDimension,
  name: string,
  includeNull: boolean,
  includeTotal: boolean,
};

export type SerializedGroupingDimensionForQuery = {
  dimension: SerializedDimension,
  includeNull: boolean,
  includeTotal: boolean,
};

class GroupingDimension
  extends Zen.BaseModel<GroupingDimension, RequiredValues, DefaultValues>
  implements
    Serializable<SerializedGroupingDimension>,
    Customizable<GroupingDimension> {
  static defaultValues = {
    includeNull: true,
    includeTotal: false,
  };

  static deserializeAsync(
    values: SerializedGroupingDimension,
  ): Promise<Zen.Model<GroupingDimension>> {
    return Dimension.deserializeAsync(values.dimension).then(dimension =>
      GroupingDimension.create({
        dimension,
        name: values.name,
        includeNull: values.includeNull,
        includeTotal: values.includeTotal,
      }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedGroupingDimension,
  ): Zen.Model<GroupingDimension> {
    return GroupingDimension.create({
      dimension: Dimension.UNSAFE_deserialize(values.dimension),
      name: values.name,
      includeNull: values.includeNull,
      includeTotal: values.includeTotal,
    });
  }

  id(): string {
    return this._.dimension().id();
  }

  serialize(): SerializedGroupingDimension {
    return {
      dimension: this._.dimension().serialize(),
      name: this._.name(),
      includeNull: this._.includeNull(),
      includeTotal: this._.includeTotal(),
    };
  }

  serializeForQuery(): SerializedGroupingDimensionForQuery {
    return {
      dimension: this._.dimension().serialize(),
      includeNull: this._.includeNull(),
      includeTotal: this._.includeTotal(),
    };
  }

  // NOTE(stephen): A unique Dimension can only be added once in the Group By
  // panel, so it is safe to return the exact instance during customization.
  // TODO(stephen): If we add support for per-dimension filtering then we will
  // likely need to support adding a dimension multiple times.
  customize(): Zen.Model<GroupingDimension> {
    return this._;
  }
}

export default ((GroupingDimension: any): Class<Zen.Model<GroupingDimension>>);
