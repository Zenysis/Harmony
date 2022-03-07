// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import AndFilter from 'models/core/wip/QueryFilter/AndFilter';
import Field from 'models/core/wip/Field';
import GroupingDimension from 'models/core/wip/GroupingItem/GroupingDimension';
import GroupingItemUtil from 'models/core/wip/GroupingItem/GroupingItemUtil';
import HierarchicalDimensionService from 'services/AdvancedQueryApp/HierarchicalDimensionService';
import QueryFilterItemUtil from 'models/core/wip/QueryFilterItem/QueryFilterItemUtil';
import type {
  GroupingItem,
  SerializedGroupingItem,
  SerializedGroupingItemForQuery,
} from 'models/core/wip/GroupingItem/types';
import type {
  QueryFilter,
  SerializedQueryFilter,
} from 'models/core/wip/QueryFilter/types';
import type {
  QueryFilterItem,
  SerializedQueryFilterItem,
} from 'models/core/wip/QueryFilterItem/types';
import type { Serializable } from 'lib/Zen';
import type { SerializedFieldForQuery } from 'models/core/wip/Field';

type RequiredValues = {
  fields: Zen.Array<Field>,

  // NOTE(stephen, moriah): When complex filtering is added,
  // this will need to change.
  filter: Zen.Array<QueryFilterItem>,
  groups: Zen.Array<GroupingItem>,
};

export type SerializedQuerySelections = {
  fields: $ReadOnlyArray<Zen.Serialized<Field>>,
  filters: $ReadOnlyArray<SerializedQueryFilterItem>,
  groups: $ReadOnlyArray<SerializedGroupingItem>,
};

// A serialized representation of these selections just to run a query.
// This contains only the information necessary to run a query, and drops a lot
// of extra information (e.g. display names) that is only necessary when we
// want to persist to the db (e.g. for a dashboard).
export type SerializedQuerySelectionsForQuery = {
  fields: $ReadOnlyArray<SerializedFieldForQuery>,
  filter: SerializedQueryFilter | { type?: void, ... },
  groups: $ReadOnlyArray<SerializedGroupingItemForQuery>,
};

/**
 * The QuerySelections model stores the selected fields, groupings, and filters
 * made by the user in the AQT query form. It holds all information necessary to
 * run a query.
 */
class QuerySelections
  extends Zen.BaseModel<QuerySelections, RequiredValues, {}, {}>
  implements Serializable<SerializedQuerySelections> {
  static deserializeAsync(
    values: SerializedQuerySelections,
  ): Promise<Zen.Model<QuerySelections>> {
    return new Promise(resolve => {
      const { fields, filters, groups } = values;

      const fieldPromises = Promise.all(fields.map(Field.deserializeAsync));
      const filterPromises = Promise.all(
        filters.map(QueryFilterItemUtil.deserializeAsync),
      );
      const groupByPromises = Promise.all(
        groups.map(GroupingItemUtil.deserializeAsync),
      );

      resolve(
        Promise.all([fieldPromises, filterPromises, groupByPromises]).then(
          ([fieldsRes, filterRes, groupsRes]) =>
            QuerySelections.create({
              fields: Zen.Array.create(fieldsRes),
              filter: Zen.Array.create(filterRes),
              groups: Zen.Array.create(groupsRes),
            }),
        ),
      );
    });
  }

  buildQueryFilter(): QueryFilter | void {
    const filters = [];

    // NOTE(stephen): Some QueryFilterItems can produce an empty filter
    // (undefined). Exclude those filters from the query.
    this._.filter().forEach((filterItem: QueryFilterItem) => {
      const filter = QueryFilterItemUtil.getFilter(filterItem);
      if (filter !== undefined) {
        filters.push(filter);
      }
    });

    if (filters.length === 0) {
      return undefined;
    }

    // Minor optimization to avoid constructing an AndFilter with only a single
    // filter inside.
    if (filters.length === 1) {
      return filters[0];
    }

    // NOTE(moriah): Right now we are only supporting a single AND filter around
    // all selected filters.
    return AndFilter.create({
      fields: Zen.Array.create(filters),
    });
  }

  isRequestingTotalRow(): boolean {
    const groupingDimensions = [];
    this._.groups().forEach(group => {
      if (group instanceof GroupingDimension) {
        groupingDimensions.push(group);
      }
    });

    return groupingDimensions.some(dimension => dimension.includeTotal());
  }

  serialize(): SerializedQuerySelections {
    return {
      fields: this._.fields().mapValues(field => field.serialize()),
      filters: QueryFilterItemUtil.serializeAppliedItems(
        this._.filter().arrayView(),
      ),
      groups: this._.groups().mapValues(GroupingItemUtil.serialize),
    };
  }

  serializeForQuery(): SerializedQuerySelectionsForQuery {
    const filter = this.buildQueryFilter();
    return {
      fields: this._.fields().mapValues(field => field.serializeForQuery()),
      filter: filter !== undefined ? filter.serialize() : {},
      groups: this._.groups().mapValues(group => group.serializeForQuery()),
    };
  }

  serializeForDisaggregatedQuery(): SerializedQuerySelectionsForQuery {
    const filter = this.buildQueryFilter();
    const geoFieldOrdering = HierarchicalDimensionService.getGeoFieldOrdering();
    const requestDimensions = [];
    // $FlowFixMe[incompatible-call]
    this._.groups().forEach(group => {
      const serializedGroup = group.serializeForQuery();
      if (
        'dimension' in serializedGroup &&
        !geoFieldOrdering.includes(serializedGroup.dimension)
      ) {
        requestDimensions.push(serializedGroup);
      }
    });
    const disaggregatedDimensions = geoFieldOrdering.map(dim => {
      return {
        dimension: dim,
        includeAll: false,
        includeNull: true,
        includeTotal: false,
      };
    });
    const disaggregatedGranularities = [
      { granularity: 'day', includeTotal: false },
    ];
    return {
      fields: this._.fields().mapValues(field => field.serializeForQuery()),
      filter: filter !== undefined ? filter.serialize() : {},
      groups: [
        ...requestDimensions,
        ...disaggregatedGranularities,
        ...disaggregatedDimensions,
      ],
    };
  }

  /**
   * Determine if this QuerySelections will produce the same backend Query
   * representation as the other QuerySelections passed in.
   */
  isQueryEqual(otherQuery: Zen.Model<QuerySelections>): boolean {
    if (this._ === otherQuery) {
      return true;
    }

    // If the number of fields or groups has changed, a new query is needed.
    // NOTE(stephen): Instead of checking each filter directly, we require the
    // full set of filters to match.
    const otherFields = otherQuery.fields();
    const otherGroups = otherQuery.groups();
    if (
      this._.fields().size() !== otherFields.size() ||
      this._.groups().size() !== otherGroups.size() ||
      this._.filter() !== otherQuery.filter()
    ) {
      return false;
    }

    return (
      this._.fields().every((field, idx) =>
        field.isFieldQueryEqual(otherFields.get(idx)),
      ) &&
      this._.groups().every((item, idx) =>
        GroupingItemUtil.isGroupingItemQueryEqual(item, otherGroups.get(idx)),
      )
    );
  }
}

export default ((QuerySelections: $Cast): Class<Zen.Model<QuerySelections>>);
