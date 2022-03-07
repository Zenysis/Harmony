// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Granularity from 'models/core/wip/Granularity';
import type { Customizable } from 'types/interfaces/Customizable';
import type { Identifiable } from 'types/interfaces/Identifiable';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  granularity: string,
  name: string,
};

type DefaultValues = {
  includeTotal: boolean,
};

type SerializedGroupingGranularity = {
  granularity: string,
  includeTotal: boolean,
  name: string,
};

export type SerializedGroupingGranularityForQuery = {
  granularity: string,
  includeTotal: boolean,
};

/**
 * The GroupingGranularity model stores a granularity ID and any user
 * customizations made. The granularity ID represents the type of date grouping
 * to apply (i.e. day, month, year). When `includeTotal` is set, a total value
 * across all date groupings will be calculated.
 */
class GroupingGranularity
  extends Zen.BaseModel<GroupingGranularity, RequiredValues, DefaultValues>
  implements
    Serializable<SerializedGroupingGranularity>,
    Customizable<GroupingGranularity>,
    Identifiable {
  tag: 'GROUPING_GRANULARITY' = 'GROUPING_GRANULARITY';

  static defaultValues: DefaultValues = {
    includeTotal: false,
  };

  static deserializeAsync(
    values: SerializedGroupingGranularity,
  ): Promise<Zen.Model<GroupingGranularity>> {
    const { granularity, name, includeTotal } = values;
    return Promise.resolve(
      GroupingGranularity.create({ granularity, name, includeTotal }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedGroupingGranularity,
  ): Zen.Model<GroupingGranularity> {
    const { granularity, name, includeTotal } = values;
    return GroupingGranularity.create({ granularity, name, includeTotal });
  }

  static createFromGranularity(
    granularity: Granularity,
  ): Zen.Model<GroupingGranularity> {
    return GroupingGranularity.create({
      granularity: granularity.id(),
      name: granularity.name(),
    });
  }

  id(): string {
    return this._.granularity();
  }

  serialize(): SerializedGroupingGranularity {
    return {
      granularity: this._.granularity(),
      includeTotal: this._.includeTotal(),
      name: this._.name(),
    };
  }

  serializeForQuery(): SerializedGroupingGranularityForQuery {
    return {
      granularity: this._.granularity(),
      includeTotal: this._.includeTotal(),
    };
  }

  /**
   * Determine if this GroupingGranularity will produce the same Query
   * representation as the other GroupingGranularity passed in.
   */
  isGroupingGranularityQueryEqual(
    otherGranularity: Zen.Model<GroupingGranularity>,
  ): boolean {
    return (
      this._ === otherGranularity ||
      (this._.granularity() === otherGranularity.granularity() &&
        this._.includeTotal() === otherGranularity.includeTotal())
    );
  }

  // NOTE(stephen): A unique Granularity can only be added once in the Group By
  // panel, so it is safe to return the exact instance during customization.
  customize(): Zen.Model<GroupingGranularity> {
    return this._;
  }
}

export default ((GroupingGranularity: $Cast): Class<
  Zen.Model<GroupingGranularity>,
>);
