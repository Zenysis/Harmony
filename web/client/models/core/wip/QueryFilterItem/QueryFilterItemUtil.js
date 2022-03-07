// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import DimensionService from 'services/wip/DimensionService';
import DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import DimensionValueSearchService from 'services/wip/DimensionValueSearchService';
import NotFilter from 'models/core/wip/QueryFilter/NotFilter';
import SimpleQueryFilterItem from 'models/core/wip/QueryFilterItem/SimpleQueryFilterItem';
import type Dimension from 'models/core/wip/Dimension';
import type { QueryFilter } from 'models/core/wip/QueryFilter/types';
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
      case 'SIMPLE':
        return SimpleQueryFilterItem.deserializeAsync(values.item);
      default:
        throw new Error(
          `[QueryFilterItemUtil] Invalid grouping item type '${type}' passed in deserialization`,
        );
    }
  }

  static UNSAFE_deserialize(
    values: SerializedQueryFilterItem,
  ): QueryFilterItem {
    switch (values.type) {
      case 'CUSTOMIZABLE_TIME_INTERVAL':
        return CustomizableTimeInterval.UNSAFE_deserialize(values.item);
      case 'DIMENSION_VALUE': {
        return DimensionValueFilterItem.UNSAFE_deserialize(values.item);
      }
      default:
        throw new Error(
          `[QueryFilterItemUtil] Invalid grouping item type '${values.type}' passed in deserialization`,
        );
    }
  }

  static serialize(
    item:
      | CustomizableTimeInterval
      | DimensionValueFilterItem
      | SimpleQueryFilterItem,
  ): SerializedQueryFilterItem {
    if (item.tag === 'CUSTOMIZABLE_TIME_INTERVAL') {
      return {
        type: 'CUSTOMIZABLE_TIME_INTERVAL',
        item: item.serialize(),
      };
    }
    if (item.tag === 'DIMENSION_VALUE_FILTER_ITEM') {
      return {
        type: 'DIMENSION_VALUE',
        item: item.serialize(),
      };
    }

    // We should only have the SimpleQueryFilterItem left.
    (item.tag: 'SIMPLE_QUERY_FILTER_ITEM');
    return {
      type: 'SIMPLE',
      item: item.serialize(),
    };
  }

  /**
   * Build a serialized representation of the QueryFilterItem. Only applied,
   * non-empty QueryFilterItems will be serialized.
   */
  static serializeAppliedItems(
    items: $ReadOnlyArray<QueryFilterItem>,
  ): $ReadOnlyArray<SerializedQueryFilterItem> {
    return this.removeEmptyItems(items).map(item => this.serialize(item));
  }

  /**
   * Remove any QueryFilterItems that would produce an empty query filter.
   */
  static removeEmptyItems(
    items: $ReadOnlyArray<QueryFilterItem>,
  ): $ReadOnlyArray<
    CustomizableTimeInterval | DimensionValueFilterItem | SimpleQueryFilterItem,
  > {
    const output = [];

    items.forEach(item => {
      // Unapplied query filter items should not be included in the result since
      // they have not been confirmed by the user.
      if (item.tag === 'UNAPPLIED_QUERY_FILTER_ITEM') {
        return;
      }

      // If a DimensionValueFilterItem has zero values to filter on selected, it
      // should not be included.
      if (item.tag === 'DIMENSION_VALUE_FILTER_ITEM' && item.isEmpty()) {
        return;
      }
      output.push(item);
    });
    return output;
  }

  static getFilter(item: QueryFilterItem): QueryFilter | void {
    // Note(david, stephen): If we return item.filter() directly flow produces
    // errors. This is because on CustomizableTimeInterval and
    // SimpleQueryFilterItem, filter is a property of the ZenModel where as for
    // DimensionValueFilterItem it is a class method.
    switch (item.tag) {
      case 'CUSTOMIZABLE_TIME_INTERVAL':
        return item.getFullyBuiltFilter();
      case 'DIMENSION_VALUE_FILTER_ITEM':
        return item.getFullyBuiltFilter();
      case 'SIMPLE_QUERY_FILTER_ITEM':
        return item.filter();
      case 'UNAPPLIED_QUERY_FILTER_ITEM':
        return undefined;
      default:
        (item.tag: empty);
        throw new Error(
          '[QueryFilterItemUtil] Cannot get filter for QueryFilterItem',
        );
    }
  }

  /**
   * Create a DimensionValueFilterItem from a search term (e.g. the value string
   * 'Amhara'), and the dimension (e.g. 'RegionName').
   *
   * @param {string} searchTerm the search term for the dimension value, e.g.
   * 'Amhara'
   * @param {string | Dimensino} dimension The dimension we will search in. This
   * can be represented as its string id (e.g. 'RegionName') or the full
   * Dimension model.
   */
  static getDimensionFilterItemFromSearchTerm(
    searchTerm: string,
    dimension: string | Dimension,
  ): Promise<DimensionValueFilterItem | void> {
    const dimensionPromise =
      typeof dimension === 'string'
        ? DimensionService.get(dimension)
        : Promise.resolve(dimension);

    return dimensionPromise
      .then((dimensionModel: Dimension | void) =>
        dimensionModel === undefined
          ? undefined
          : DimensionValueSearchService.get(searchTerm, dimensionModel.id()),
      )
      .then(dimensionValues =>
        dimensionValues === undefined || dimensionValues.length === 0
          ? undefined
          : DimensionValueFilterItem.createFromDimensionValues(
              ...dimensionValues,
            ),
      );
  }
}
