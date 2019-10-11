// @flow
import * as Zen from 'lib/Zen';
import type Granularity from 'models/core/wip/Granularity';
import type GroupingDimension, {
  SerializedGroupingDimensionForQuery,
} from 'models/core/wip/GroupingItem/GroupingDimension';

type GroupingItemMap = {
  GROUPING_DIMENSION: GroupingDimension,
  GRANULARITY: Granularity,
};

export type GroupingItemType = $Keys<GroupingItemMap>;
export type GroupingItem = $Values<GroupingItemMap>;

// This is the type we use to serialize a grouping item to our db
// (so it can be reconstructed again in a dashboard)
export type SerializedGroupingItem =
  | {
      type: 'GRANULARITY',
      item: Zen.Serialized<Granularity>,
    }
  | {
      type: 'GROUPING_DIMENSION',
      item: Zen.Serialized<GroupingDimension>,
    };

// This is the type we use to serialize a grouping item for a query.
// It no longer needs the {type, item} tuple, because the backend can identify
// that on its own with the JSONRef that's a part of these serialized values.
// Only the fields that are explicitly needed for querying are included.
export type SerializedGroupingItemForQuery =
  | SerializedGroupingDimensionForQuery
  | Zen.Serialized<Granularity>;
