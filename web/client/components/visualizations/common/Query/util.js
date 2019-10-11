// @flow
import { DruidFilter } from 'components/visualizations/util/druid';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';

// Create a mapping from the level selected on the query form (like woreda,
// or region) to the full list of dimensions needed to issue a query at that
// level. This is a workaround for the SimpleQuerySelections object only
// allowing a single grouping "granularity" (dimension) at a time.
const DIMENSIONS_FOR_SELECTED_LEVEL: { [string]: $ReadOnlyArray<string> } = {};
const { tableColumns } = window.__JSON_FROM_BACKEND;
Object.keys(tableColumns).forEach(level => {
  DIMENSIONS_FOR_SELECTED_LEVEL[level] = tableColumns[level].concat([level]);
});

// Build the full list of dimensions needed to run a query.
export function getDimensionsForQuery(
  selections: SimpleQuerySelections,
): $ReadOnlyArray<string> {
  const level = selections.granularity();
  // Workaround the query form passing "nation" as a value which is not a real
  // dimension.
  if (!level || level === 'nation') {
    return [];
  }
  return DIMENSIONS_FOR_SELECTED_LEVEL[level] || [level];
}

// Construct a Druid filter from the legacy query selections filter object.
export function buildLegacyQueryFilter(
  selections: SimpleQuerySelections,
): DruidFilter | void {
  const filters = [];
  const legacyFilter = selections.filters();
  Object.keys(legacyFilter).forEach(dimensionCategory => {
    const filterModel = legacyFilter[dimensionCategory];
    if (filterModel) {
      const filterObj = filterModel.criteria();
      // If the filter object is a color filter then do *not* add it to the db
      // Query, otherwise it will break things in the backend.
      if (!filterObj || 'colorFilters' in filterObj) {
        return;
      }

      const newFilters = Object.keys(filterObj)
        // The query form stores the geography filter's display value on
        // top of the original geography filter object.
        .filter(dimension => dimension !== '_display')
        .map(dimension =>
          DruidFilter.SELECTOR(dimension, filterObj[dimension]),
        );

      if (newFilters.length) {
        filters.push(DruidFilter.AND(newFilters));
      }
    }
  });

  if (!filters.length) {
    return undefined;
  }
  return DruidFilter.AND(filters);
}

// Build a DruidFilter that excludes missing values for the specified dimension.
function buildEmptyDimensionFilter(dimension?: string): DruidFilter | void {
  if (!dimension || dimension === 'nation') {
    return undefined;
  }

  return DruidFilter.NOT(DruidFilter.SELECTOR(dimension, ''));
}

export function buildQueryFilterFromSelections(
  selections: SimpleQuerySelections,
): DruidFilter | void {
  const emptyDimensionFilter = buildEmptyDimensionFilter(
    selections.granularity(),
  );
  const queryFilter = buildLegacyQueryFilter(selections);
  return emptyDimensionFilter && queryFilter
    ? DruidFilter.AND([emptyDimensionFilter, queryFilter])
    : emptyDimensionFilter || queryFilter;
}

export function buildBaseRequest(
  dimensions: $ReadOnlyArray<string>,
  fields: $ReadOnlyArray<string>,
  granularity: string,
  queryFilter?: DruidFilter,
  startDate: string,
  endDate: string,
  labelDimensions: $ReadOnlyArray<string> = [],
  denominator?: string,
) {
  // Value groups are used to create custom fields from a formula. Currently
  // only used for denominators.
  const valueGroups = {};
  if (denominator) {
    fields.forEach(field => {
      if (field !== denominator) {
        valueGroups[field] = `(${field} / ${denominator})`;
      }
    });
  }

  return {
    dimensions,
    fields,
    granularity,
    queryFilter,
    startDate,
    endDate,
    valueGroups,
    labelDimensions,
  };
}
