// @flow
import * as Zen from 'lib/Zen';
import type GroupingDimension, {
  SerializedGroupingDimensionForQuery,
} from 'models/core/wip/GroupingItem/GroupingDimension';
import type GroupingGranularity, {
  SerializedGroupingGranularityForQuery,
} from 'models/core/wip/GroupingItem/GroupingGranularity';

type GroupingItemMap = {
  GROUPING_DIMENSION: GroupingDimension,
  GROUPING_GRANULARITY: GroupingGranularity,
};

export type GroupingItemType = $Keys<GroupingItemMap>;
export type GroupingItem = $Values<GroupingItemMap>;

// This is the type we use to serialize a grouping item to our db
// (so it can be reconstructed again in a dashboard)
export type SerializedGroupingItem =
  | {
      type: 'GROUPING_GRANULARITY',
      item: Zen.Serialized<GroupingGranularity>,
    }
  | {
      type: 'GROUPING_DIMENSION',
      item: Zen.Serialized<GroupingDimension>,
    };

// This is the type we use to serialize a grouping item for a query.
// It no longer needs the {type, item} tuple, because the backend can identify
// that on its own based on the existence of `dimension` or `granularity`
// properties. Only the fields that are explicitly needed for querying are
// included.
export type SerializedGroupingItemForQuery =
  | SerializedGroupingDimensionForQuery
  | SerializedGroupingGranularityForQuery;
