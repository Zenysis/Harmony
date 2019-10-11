// @flow
import * as Zen from 'lib/Zen';
import CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import NotFilter from 'models/core/wip/QueryFilter/NotFilter';
import type {
  QueryFilterItem,
  SerializedQueryFilterItem,
} from 'models/core/wip/QueryFilterItem/types';

/**
 * QueryFilterItemUtil is a static serializer/deserializer for all customizable
 * query filter item types:
 *   - CustomizableTimeInterval
 *   - DimensionValueFilterItem
 */
export default class QueryFilterItemUtil {
  static deserializeAsync(
    values: SerializedQueryFilterItem,
  ): Promise<QueryFilterItem> {
    const { type } = values;
    switch (values.type) {
      case 'CUSTOMIZABLE_TIME_INTERVAL':
        return CustomizableTimeInterval.deserializeAsync(values.item);
      case 'DIMENSION_VALUE': {
        const { item } = values;

        // HACK(stephen): Support previous style of dimension value filters
        // since migrating the dashboards will be difficult.
        // TODO(stephen): Remove this when all priority dashboards have been
        // migrated. This should realistically only affect MZ since no other
        // deployments were creating important dashboards from AQT queries.
        if ('filter' in item) {
          const legacyItem: Zen.Serialized<DimensionValue> = (item: any);
          return DimensionValue.deserializeAsync(legacyItem).then(
            (value: DimensionValue) => {
              const filter = value.filter();
              if (filter instanceof NotFilter) {
                return DimensionValueFilterItem.createFromDimensionValues(
                  value.filter(filter.field()),
                ).invert(true);
              }
              return DimensionValueFilterItem.createFromDimensionValues(value);
            },
          );
        }
        return DimensionValueFilterItem.deserializeAsync(item);
      }
      default:
        throw new Error(
          `[QueryFilterItemUtil] Invalid grouping item type '${type}' passed in deserialization`,
        );
    }
  }

  static serialize(item: QueryFilterItem): SerializedQueryFilterItem {
    if (item instanceof CustomizableTimeInterval) {
      return {
        type: 'CUSTOMIZABLE_TIME_INTERVAL',
        item: Zen.cast<CustomizableTimeInterval>(item).serialize(),
      };
    }
    if (item instanceof DimensionValueFilterItem) {
      return {
        type: 'DIMENSION_VALUE',
        item: Zen.cast<DimensionValueFilterItem>(item).serialize(),
      };
    }
    throw new Error(
      '[QueryFilterItemUtil] Invalid grouping item passed in serialization',
    );
  }
}
