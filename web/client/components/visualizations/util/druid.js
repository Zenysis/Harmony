function unsupportedFilter(type) {
  // eslint-disable-next-line no-console
  console.error(`Filter type (${type}) is unsupported`);
  return {};
}

// Build a valid druid filter object
// eslint-disable-next-line import/prefer-default-export
export const DruidFilter = {
  AND(filterList) {
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

  COLUMN_COMPARISON(dimensions) {
    return {
      type: 'columnComparison',
      dimensions: dimensions.slice(),
    };
  },

  IN(dimension, values) {
    // Optimization for single value filter
    if (values.length === 1) {
      return DruidFilter.SELECTOR(dimension, values[0]);
    }

    return {
      type: 'in',
      dimension,
      values: values.slice(),
    };
  },

  NOT(filter) {
    return {
      type: 'not',
      field: filter,
    };
  },

  OR(filterList) {
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
