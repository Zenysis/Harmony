// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Granularity from 'models/core/wip/Granularity';
import GroupingDimension from 'models/core/wip/GroupingItem/GroupingDimension';
import GroupingGranularity from 'models/core/wip/GroupingItem/GroupingGranularity';
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
      case 'GROUPING_GRANULARITY':
        return GroupingGranularity.deserializeAsync(values.item);
      default: {
        // HACK(stephen): Support previous style of serialized grouping
        // granularities before we had GroupingGranularity type. This in theory
        // should only happen for saved queries (either locally in a user's
        // session or shared by URL).
        if (type === 'GRANULARITY') {
          const legacyItem: Zen.Serialized<Granularity> = (values.item: any);
          return Granularity.deserializeAsync(legacyItem).then(
            GroupingGranularity.createFromGranularity,
          );
        }

        throw new Error(
          `[GroupingItemUtil] Invalid grouping item type '${type}' passed in deserialization`,
        );
      }
    }
  }

  static serialize(item: GroupingItem): SerializedGroupingItem {
    if (item.tag === 'GROUPING_DIMENSION') {
      return {
        type: 'GROUPING_DIMENSION',
        item: item.serialize(),
      };
    }
    if (item.tag === 'GROUPING_GRANULARITY') {
      return {
        type: 'GROUPING_GRANULARITY',
        item: item.serialize(),
      };
    }

    (item.tag: empty);
    throw new Error(
      '[GroupingItemUtil] Invalid grouping item passed in serialization',
    );
  }

  static serializeForQuery(item: GroupingItem): SerializedGroupingItemForQuery {
    return item.serializeForQuery();
  }

  /**
   * Determine if this GroupingItem will produce the same Query representation
   * as the other GroupingItem passed in.
   */
  static isGroupingItemQueryEqual(
    currentItem: GroupingItem,
    previousItem: GroupingItem,
  ): boolean {
    if (currentItem === previousItem) {
      return true;
    }

    if (
      currentItem instanceof GroupingDimension &&
      previousItem instanceof GroupingDimension
    ) {
      return currentItem.isGroupingDimensionQueryEqual(previousItem);
    }

    if (
      currentItem instanceof GroupingGranularity &&
      previousItem instanceof GroupingGranularity
    ) {
      return currentItem.isGroupingGranularityQueryEqual(previousItem);
    }

    return false;
  }
}
