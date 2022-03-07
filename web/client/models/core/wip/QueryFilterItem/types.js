// @flow
import * as Zen from 'lib/Zen';
import type CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import type DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import type SimpleQueryFilterItem from 'models/core/wip/QueryFilterItem/SimpleQueryFilterItem';
import type UnappliedQueryFilterItem from 'models/core/wip/QueryFilterItem/UnappliedQueryFilterItem';

/**
 * This file holds the union types for a QueryFilterItem. This is NOT the same
 * as a QueryFilter.
 *
 * A QueryFilter is a filter primitive (AND, NOT, OR, etc.) used to execute
 * a query. A QueryFilterItem is a customizable item that *wraps* a filter, and
 * also holds more information beyond just the filter primitive used to execute
 * the query on the backend. It also holds information the user has entered
 * to *describe* the filter - information that has to be persisted so that the
 * exact filter selections can be reconstructed (e.g. in a dashboard).
 *
 * For example, a filter item might have a custom name to identify it. A date
 * filter item might have a dateType (e.g. LAST_CALENDAR_YEAR,
 * LAST_CALENDAR_MONTH) that the user selected to easily describe the filter.
 *
 */
type QueryFilterItemMap = {
  CUSTOMIZABLE_TIME_INTERVAL: CustomizableTimeInterval,
  DIMENSION_VALUE: DimensionValueFilterItem,
  SIMPLE: SimpleQueryFilterItem,
  UNAPPLIED: UnappliedQueryFilterItem,
};

export type QueryFilterItemType = $Keys<QueryFilterItemType>;
export type QueryFilterItem = $Values<QueryFilterItemMap>;

// This is the type we use to serialize a customizable query filter item
// to our db (so it can be reconstructed again in a dashboard)
export type SerializedQueryFilterItem =
  | {
      type: 'CUSTOMIZABLE_TIME_INTERVAL',
      item: Zen.Serialized<CustomizableTimeInterval>,
    }
  | {
      type: 'DIMENSION_VALUE',
      item: Zen.Serialized<DimensionValueFilterItem>,
    }
  | {
      type: 'SIMPLE',
      item: Zen.Serialized<SimpleQueryFilterItem>,
    };
