// @flow
import * as Zen from 'lib/Zen';
import type AndFilter, {
  SerializedAndFilter,
} from 'models/core/wip/QueryFilter/AndFilter';
import type FieldFilter from 'models/core/wip/QueryFilter/FieldFilter';
import type FieldInFilter from 'models/core/wip/QueryFilter/FieldInFilter';
import type InFilter from 'models/core/wip/QueryFilter/InFilter';
import type IntervalFilter from 'models/core/wip/QueryFilter/IntervalFilter';
import type NotFilter, {
  SerializedNotFilter,
} from 'models/core/wip/QueryFilter/NotFilter';
import type OrFilter, {
  SerializedOrFilter,
} from 'models/core/wip/QueryFilter/OrFilter';
import type SelectorFilter from 'models/core/wip/QueryFilter/SelectorFilter';

type QueryFilterMap = {
  AND: AndFilter,
  FIELD: FieldFilter,
  FIELD_IN: FieldInFilter,
  IN: InFilter,
  INTERVAL: IntervalFilter,
  NOT: NotFilter,
  OR: OrFilter,
  SELECTOR: SelectorFilter,
};

export type QueryFilterType = $Keys<QueryFilterMap>;
export type QueryFilter = $Values<QueryFilterMap>;

// A union of all the serialized filter values.
// Ideally, they should all use `Zen.Serialized`, but Flow was having trouble
// with the recursive types in And/Not/Or. So for those filters, we import the
// values directly instead of using Zen.Serialized. For all others we should use
// Zen.Serialized.
export type SerializedQueryFilter =
  | SerializedAndFilter
  | Zen.Serialized<FieldFilter>
  | Zen.Serialized<FieldInFilter>
  | Zen.Serialized<InFilter>
  | Zen.Serialized<IntervalFilter>
  | SerializedNotFilter
  | SerializedOrFilter
  | Zen.Serialized<SelectorFilter>;
