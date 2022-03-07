// @flow
/* eslint-disable no-use-before-define */

function unsupportedFilter(type): { ... } {
  // eslint-disable-next-line no-console
  console.error(`Filter type (${type}) is unsupported`);
  return {};
}

type DruidFilterMap = {
  AND: { type: 'and', fields: $ReadOnlyArray<DruidFilter> },
  COLUMN_COMPARISON: { type: 'columnComparison', dimensions: Array<mixed> },
  IN:
    | { type: 'in', dimension: mixed, values: Array<mixed> }
    | $PropertyType<DruidFilterMap, 'SELECTOR'>,
  NOT: { type: 'not', field: DruidFilter },
  OR: { type: 'or', fields: $ReadOnlyArray<DruidFilter> },
  REGEX: { type: 'regex', dimension: mixed, pattern: mixed },
  SELECTOR: { type: 'selector', dimension: mixed, value: mixed },
};

export type DruidFilter = $Values<DruidFilterMap>;

interface IDruidFilter {
  AND(filterList: $ReadOnlyArray<DruidFilter>): DruidFilter;
  COLUMN_COMPARISON(
    dimensions: $ReadOnlyArray<mixed>,
  ): $PropertyType<DruidFilterMap, 'COLUMN_COMPARISON'>;
  IN(
    dimension: mixed,
    values: $ReadOnlyArray<mixed>,
  ): $PropertyType<DruidFilterMap, 'IN'>;
  NOT(filter: DruidFilter): $PropertyType<DruidFilterMap, 'NOT'>;
  OR(filterList: $ReadOnlyArray<DruidFilter>): DruidFilter;
  REGEX(
    dimension: mixed,
    pattern: mixed,
  ): $PropertyType<DruidFilterMap, 'REGEX'>;
  SELECTOR(
    dimension: mixed,
    value: mixed,
  ): $PropertyType<DruidFilterMap, 'SELECTOR'>;

  // Unsupported filters:
  BOUND(): { ... };
  EXTRACTION(): { ... };
  LIKE(): { ... };
  INTERVAL(): { ... };
  JS(): { ... };
}

// Build a valid druid filter object
// eslint-disable-next-line import/prefer-default-export
export const DruidFilterUtil: IDruidFilter = {
  AND(filterList: $ReadOnlyArray<DruidFilter>) {
    // If the filter list only contains a single element, we can just return
    // the original filter.
    if (filterList.length === 1) {
      return filterList[0];
    }

    return {
      type: 'and',
      fields: filterList.slice(),
    };
  },

  COLUMN_COMPARISON(dimensions: $ReadOnlyArray<mixed>) {
    return {
      type: 'columnComparison',
      dimensions: dimensions.slice(),
    };
  },

  IN(dimension: mixed, values: $ReadOnlyArray<mixed>) {
    // Optimization for single value filter
    if (values.length === 1) {
      return DruidFilterUtil.SELECTOR(dimension, values[0]);
    }

    return {
      type: 'in',
      dimension,
      values: values.slice(),
    };
  },

  NOT(filter: DruidFilter) {
    return {
      type: 'not',
      field: filter,
    };
  },

  OR(filterList: $ReadOnlyArray<DruidFilter>): DruidFilter {
    // If the filter list only contains a single element, we can just return
    // the original filter.
    if (filterList.length === 1) {
      return filterList[0];
    }

    return {
      type: 'or',
      fields: filterList.slice(),
    };
  },

  REGEX(dimension, pattern) {
    return {
      type: 'regex',
      dimension,
      pattern,
    };
  },

  SELECTOR(dimension, value) {
    return {
      type: 'selector',
      dimension,
      value,
    };
  },

  // Unsupported filters
  BOUND() {
    return unsupportedFilter('bound');
  },
  EXTRACTION() {
    return unsupportedFilter('extraction');
  },
  LIKE() {
    return unsupportedFilter('like');
  },
  INTERVAL() {
    return unsupportedFilter('interval');
  },
  JS() {
    return unsupportedFilter('javascript');
  },
};
