// @flow
import * as Zen from 'lib/Zen';
import Dimension from 'models/core/wip/Dimension';
import GroupingDimension from 'models/core/wip/GroupingItem/GroupingDimension';
import Granularity from 'models/core/wip/Granularity';
import type {
  GroupingItem,
  SerializedGroupingItem,
  SerializedGroupingItemForQuery,
} from 'models/core/wip/GroupingItem/types';

/**
 * GroupingItemUtil is a static serializer/deserializer for all grouping item
 * types:
 *   - GroupingDimension (e.g. group by region)
 *   - Granularity (e.g. group by time granularity, like group by Month)
 */
export default class GroupingItemUtil {
  static deserializeAsync(
    values: SerializedGroupingItem,
  ): Promise<GroupingItem> {
    const { type } = values;
    switch (values.type) {
      case 'GROUPING_DIMENSION':
        return GroupingDimension.deserializeAsync(values.item);
      case 'GRANULARITY':
        return Granularity.deserializeAsync(values.item);
      default: {
        // HACK(stephen): Support previous style of serialized grouping
        // dimensions since migrating the dashboards will be difficult.
        // TODO(stephen): Remove this when all priority dashboards have been
        // migrated. This should realistically only affect MZ since no other
        // deployments were creating important dashboards from AQT queries.
        // NOTE(stephen): Placing this inside `default` to ensure flow refines
        // properly.
        if (type === 'DIMENSION') {
          const legacyItem: Zen.Serialized<Dimension> = (values.item: any);
          return Dimension.deserializeAsync(legacyItem).then(dimension =>
            GroupingDimension.create({
              dimension,
              name: dimension.name(),
              includeNull: true, // Previous behavior.
              includeTotal: false,
            }),
          );
        }
        throw new Error(
          `[GroupingItemUtil] Invalid grouping item type '${type}' passed in deserialization`,
        );
      }
    }
  }

  static serialize(item: GroupingItem): SerializedGroupingItem {
    if (item instanceof GroupingDimension) {
      return {
        type: 'GROUPING_DIMENSION',
        item: Zen.cast<GroupingDimension>(item).serialize(),
      };
    }
    if (item instanceof Granularity) {
      return {
        type: 'GRANULARITY',
        item: Zen.cast<Granularity>(item).serialize(),
      };
    }
    throw new Error(
      '[GroupingItemUtil] Invalid grouping item passed in serialization',
    );
  }

  static serializeForQuery(item: GroupingItem): SerializedGroupingItemForQuery {
    if (item instanceof GroupingDimension) {
      (item: GroupingDimension);
      return Zen.cast<GroupingDimension>(item).serializeForQuery();
    }
    if (item instanceof Granularity) {
      return Zen.cast<Granularity>(item).serialize();
    }
    throw new Error(
      '[GroupingItemUtil] Invalid grouping item passed in serialization',
    );
  }
}
