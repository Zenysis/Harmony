// @flow
import * as Zen from 'lib/Zen';
import AndFilter from 'models/core/wip/QueryFilter/AndFilter';
import Field from 'models/core/wip/Field';
import GroupingItemUtil from 'models/core/wip/GroupingItem/GroupingItemUtil';
import QueryFilterItemUtil from 'models/core/wip/QueryFilterItem/QueryFilterItemUtil';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import {
  computeSimpleQuerySelections,
  shouldRecomputeSimpleQuerySelections,
} from 'models/core/wip/QuerySelections/derivedComputations';
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

type Values = {
  fields: Zen.Array<Field>,

  // NOTE(stephen, moriah): When complex filtering is added,
  // this will need to change.
  filter: Zen.Array<QueryFilterItem>,
  groups: Zen.Array<GroupingItem>,
};

type DerivedValues = {
  simpleQuerySelections: SimpleQuerySelections,
  legacySelections: Zen.Serialized<SimpleQuerySelections>,
};

export type SerializedQuerySelections = {
  fields: Array<Zen.Serialized<Field>>,
  filters: Array<SerializedQueryFilterItem>,
  groups: Array<SerializedGroupingItem>,
};

// A serialized representation of these selections just to run a query.
// This contains only the information necessary to run a query, and drops a lot
// of extra information (e.g. display names) that is only necessary when we
// want to persist to the db (e.g. for a dashboard).
type SerializedQuerySelectionsForQuery = {
  fields: Array<SerializedFieldForQuery>,
  filter: SerializedQueryFilter | {},
  groups: Array<SerializedGroupingItemForQuery>,
};

/**
 * The QuerySelections model stores the selected fields, groupings, and filters
 * made by the user in the AQT query form. It holds all information necessary to
 * run a query.
 */
class QuerySelections
  extends Zen.BaseModel<QuerySelections, Values, {}, DerivedValues>
  implements Serializable<SerializedQuerySelections> {
  static derivedConfig = {
    simpleQuerySelections: [
      shouldRecomputeSimpleQuerySelections,
      computeSimpleQuerySelections,
    ],
    legacySelections: [
      shouldRecomputeSimpleQuerySelections,
      cur => cur.simpleQuerySelections().legacySelections(),
    ],
  };

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
      const filter = filterItem.filter();
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

  serialize(): SerializedQuerySelections {
    return {
      fields: this._.fields().mapValues(field => field.serialize()),
      filters: this._.filter().mapValues(QueryFilterItemUtil.serialize),
      groups: this._.groups().mapValues(GroupingItemUtil.serialize),
    };
  }

  serializeForQuery(): SerializedQuerySelectionsForQuery {
    const filter = this.buildQueryFilter();
    return {
      filter: filter !== undefined ? filter.serialize() : {},
      fields: this._.fields().mapValues(field => field.serializeForQuery()),
      groups: this._.groups().mapValues(group => group.serializeForQuery()),
    };
  }
}

export default ((QuerySelections: any): Class<Zen.Model<QuerySelections>>);
