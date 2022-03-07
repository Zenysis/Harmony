// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
// eslint-disable-next-line import/no-cycle
import AndFilter from 'models/core/wip/QueryFilter/AndFilter';
import FieldFilter from 'models/core/wip/QueryFilter/FieldFilter';
import FieldInFilter from 'models/core/wip/QueryFilter/FieldInFilter';
import InFilter from 'models/core/wip/QueryFilter/InFilter';
import IntervalFilter from 'models/core/wip/QueryFilter/IntervalFilter';
// eslint-disable-next-line import/no-cycle
import NotFilter from 'models/core/wip/QueryFilter/NotFilter';
// eslint-disable-next-line import/no-cycle
import OrFilter from 'models/core/wip/QueryFilter/OrFilter';
import SelectorFilter from 'models/core/wip/QueryFilter/SelectorFilter';
import type {
  QueryFilter,
  SerializedQueryFilter,
} from 'models/core/wip/QueryFilter/types';

// HACK(stephen): Bangladesh trainings exposed a performance issue when querying
// where a large number of OR'd FieldFilters would take a long time for Druid to
// query. An optimization was added (a new FieldInFilter type) that fixed this
// issue. However, any serialized calculations (dashboards and saved queries)
// will not get this performance improvement because they have stored the
// previous filter style. This function tests to see if the filter can be
// optimized. If so, it will return a list of field IDs to use with the
// FieldInFilter. If it cannot be optimized, undefined will be returned.
// TODO(stephen): In the next dashboard spec upgrade, add this fix there and
// remove from the frontend. Unfortunately, we needed this fix out quickly and
// could not afford the instability that a new dashboard spec would introduce
// since it would need to be added to the release branch in QA and the release
// branch in prod.
// This can be removed with the release AFTER 2019-12-02.
function _optimizeOrFieldFilters(
  values: Zen.Serialized<OrFilter>,
): $ReadOnlyArray<string> | void {
  const fieldIds = [];

  // If all filters stored are FieldFilters, this OrFilter can be optimized to
  // become a FieldInFilter.
  const optimizable = values.fields.every(serializedFilter => {
    if (serializedFilter.type !== 'FIELD') {
      return false;
    }
    fieldIds.push(serializedFilter.fieldId);
    return true;
  });
  if (!optimizable) {
    return undefined;
  }

  return fieldIds;
}

export default class QueryFilterUtil {
  static deserializeAsync(values: SerializedQueryFilter): Promise<QueryFilter> {
    switch (values.type) {
      case 'AND':
        return AndFilter.deserializeAsync(values);
      case 'FIELD':
        return FieldFilter.deserializeAsync(values);
      case 'FIELD_IN':
        return FieldInFilter.deserializeAsync(values);
      case 'IN':
        return InFilter.deserializeAsync(values);
      case 'INTERVAL':
        return IntervalFilter.deserializeAsync(values);
      case 'NOT':
        return NotFilter.deserializeAsync(values);
      case 'OR': {
        const optimizableFieldIds = _optimizeOrFieldFilters(values);
        if (optimizableFieldIds !== undefined) {
          return Promise.resolve(
            FieldInFilter.create({
              fieldIds: optimizableFieldIds,
            }),
          );
        }

        return OrFilter.deserializeAsync(values);
      }
      case 'SELECTOR':
        return SelectorFilter.deserializeAsync(values);
      default:
        throw new Error(
          `[QueryFilterUtil] Invalid type provided during deserialization: ${values.type}`,
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
      case 'FIELD_IN':
        return FieldInFilter.UNSAFE_deserialize(values);
      case 'IN':
        return InFilter.UNSAFE_deserialize(values);
      case 'INTERVAL':
        return IntervalFilter.UNSAFE_deserialize(values);
      case 'NOT':
        return NotFilter.UNSAFE_deserialize(values);
      case 'OR': {
        const optimizableFieldIds = _optimizeOrFieldFilters(values);
        if (optimizableFieldIds !== undefined) {
          return FieldInFilter.create({
            fieldIds: optimizableFieldIds,
          });
        }
        return OrFilter.UNSAFE_deserialize(values);
      }
      case 'SELECTOR':
        return SelectorFilter.UNSAFE_deserialize(values);
      default:
        throw new Error(
          `[QueryFilterUtil] Invalid type provided during deserialization: ${values.type}`,
        );
    }
  }
}
