// @flow
/* eslint-disable no-use-before-define */

function unsupportedFilter(type): { ... } {
  // eslint-disable-next-line no-console
  console.error(`Filter type (${type}) is unsupported`);
  return {};
}

type DruidFilterMap = {
  AND: { fields: $ReadOnlyArray<DruidFilter>, type: 'and' },
  COLUMN_COMPARISON: { dimensions: Array<mixed>, type: 'columnComparison' },
  IN:
    | { dimension: mixed, type: 'in', values: Array<mixed> }
    | $PropertyType<DruidFilterMap, 'SELECTOR'>,
  NOT: { field: DruidFilter, type: 'not' },
  OR: { fields: $ReadOnlyArray<DruidFilter>, type: 'or' },
  REGEX: { dimension: mixed, pattern: mixed, type: 'regex' },
  SELECTOR: { dimension: mixed, type: 'selector', value: mixed },
};

export type DruidFilter = $Values<DruidFilterMap>;

interface IDruidFilter {
  AND(filterList: $ReadOnlyArray<DruidFilter>): DruidFilter;
  BOUND(): { ... }; // Unsupported filter
  COLUMN_COMPARISON(
    dimensions: $ReadOnlyArray<mixed>,
  ): $PropertyType<DruidFilterMap, 'COLUMN_COMPARISON'>;
  EXTRACTION(): { ... }; // Unsupported filter
  IN(
    dimension: mixed,
    values: $ReadOnlyArray<mixed>,
  ): $PropertyType<DruidFilterMap, 'IN'>;
  INTERVAL(): { ... }; // Unsupported filter
  JS(): { ... }; // Unsupported filter
  LIKE(): { ... }; // Unsupported filter
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
      fields: filterList.slice(),
      type: 'and',
    };
  },

  COLUMN_COMPARISON(dimensions: $ReadOnlyArray<mixed>) {
    return {
      dimensions: dimensions.slice(),
      type: 'columnComparison',
    };
  },

  IN(dimension: mixed, values: $ReadOnlyArray<mixed>) {
    // Optimization for single value filter
    if (values.length === 1) {
      return DruidFilterUtil.SELECTOR(dimension, values[0]);
    }

    return {
      dimension,
      type: 'in',
      values: values.slice(),
    };
  },

  NOT(filter: DruidFilter) {
    return {
      field: filter,
      type: 'not',
    };
  },

  OR(filterList: $ReadOnlyArray<DruidFilter>): DruidFilter {
    // If the filter list only contains a single element, we can just return
    // the original filter.
    if (filterList.length === 1) {
      return filterList[0];
    }

    return {
      fields: filterList.slice(),
      type: 'or',
    };
  },

  REGEX(dimension, pattern) {
    return {
      dimension,
      pattern,
      type: 'regex',
    };
  },

  SELECTOR(dimension, value) {
    return {
      dimension,
      value,
      type: 'selector',
    };
  },

  // Unsupported filters
  // eslint-disable-next-line sort-keys-shorthand/sort-keys-shorthand
  BOUND() {
    return unsupportedFilter('bound');
  },
  EXTRACTION() {
    return unsupportedFilter('extraction');
  },
  INTERVAL() {
    return unsupportedFilter('interval');
  },
  JS() {
    return unsupportedFilter('javascript');
  },
  LIKE() {
    return unsupportedFilter('like');
  },
};
