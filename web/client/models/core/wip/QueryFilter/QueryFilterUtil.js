// @flow
import AndFilter from 'models/core/wip/QueryFilter/AndFilter';
import FieldFilter from 'models/core/wip/QueryFilter/FieldFilter';
import InFilter from 'models/core/wip/QueryFilter/InFilter';
import IntervalFilter from 'models/core/wip/QueryFilter/IntervalFilter';
import NotFilter from 'models/core/wip/QueryFilter/NotFilter';
import OrFilter from 'models/core/wip/QueryFilter/OrFilter';
import SelectorFilter from 'models/core/wip/QueryFilter/SelectorFilter';
import type {
  QueryFilter,
  SerializedQueryFilter,
} from 'models/core/wip/QueryFilter/types';

export default class QueryFilterUtil {
  static deserializeAsync(values: SerializedQueryFilter): Promise<QueryFilter> {
    switch (values.type) {
      case 'AND':
        return AndFilter.deserializeAsync(values);
      case 'FIELD':
        return FieldFilter.deserializeAsync(values);
      case 'IN':
        return InFilter.deserializeAsync(values);
      case 'INTERVAL':
        return IntervalFilter.deserializeAsync(values);
      case 'NOT':
        return NotFilter.deserializeAsync(values);
      case 'OR':
        return OrFilter.deserializeAsync(values);
      case 'SELECTOR':
        return SelectorFilter.deserializeAsync(values);
      default:
        throw new Error(
          `[QueryFilterUtil] Invalid type provided during deserialization: ${
            values.type
          }`,
        );
    }
  }

  /**
   * UNSAFE. Deserialize the provided query filter synchronously. This method
   * requires specific setup to happen to work properly: all services that all
   * QueryFilters rely on must be initialized, the base QueryFilterMap must be
   * initialized, and any downstream models that require extra steps for
   * synchronous deserialization to happen must be performed.
   *
   * This method should rarely be used. It exists primarily for performance.
   */
  static UNSAFE_deserialize(values: SerializedQueryFilter): QueryFilter {
    switch (values.type) {
      case 'AND':
        return AndFilter.UNSAFE_deserialize(values);
      case 'FIELD':
        return FieldFilter.UNSAFE_deserialize(values);
      case 'IN':
        return InFilter.UNSAFE_deserialize(values);
      case 'INTERVAL':
        return IntervalFilter.UNSAFE_deserialize(values);
      case 'NOT':
        return NotFilter.UNSAFE_deserialize(values);
      case 'OR':
        return OrFilter.UNSAFE_deserialize(values);
      case 'SELECTOR':
        return SelectorFilter.UNSAFE_deserialize(values);
      default:
        throw new Error(
          `[QueryFilterUtil] Invalid type provided during deserialization: ${
            values.type
          }`,
        );
    }
  }
}
