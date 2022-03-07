// @flow
import Moment from 'models/core/wip/DateTime/Moment';

type DataExtractor<Row, T> = (row: Row) => T;
type Comparator<Row> = (Row, Row) => number;

/**
 * Compares two values only based on whether or not they are null/undefined.
 */
function nullComparator(a: ?mixed, b: ?mixed): number {
  if (a == null && b != null) {
    return -1;
  }
  if (a != null && b == null) {
    return 1;
  }
  return 0;
}

// a collection of helper functions to easily sort different types
// All sort functions default to being an ascending order sort.
const TableSortUtil = {
  string<Row>(dataExtractorFn: DataExtractor<Row, ?string>): Comparator<Row> {
    return (row1: Row, row2: Row) => {
      const v1 = dataExtractorFn(row1);
      const v2 = dataExtractorFn(row2);
      if (v1 != null && v2 != null) {
        return v1.localeCompare(v2);
      }
      return nullComparator(v1, v2);
    };
  },

  number<Row>(dataExtractorFn: DataExtractor<Row, ?number>): Comparator<Row> {
    return (row1: Row, row2: Row) => {
      const v1 = dataExtractorFn(row1);
      const v2 = dataExtractorFn(row2);
      if (v1 != null && v2 != null) {
        return v1 - v2;
      }
      return nullComparator(v1, v2);
    };
  },

  boolean<Row>(dataExtractorFn: DataExtractor<Row, ?boolean>): Comparator<Row> {
    return (row1: Row, row2: Row) => {
      const v1 = dataExtractorFn(row1);
      const v2 = dataExtractorFn(row2);
      if (v1 != null && v2 != null) {
        return Number(v1) - Number(v2);
      }
      return nullComparator(v1, v2);
    };
  },

  moment<Row>(
    dataExtractorFn: DataExtractor<Row, Moment | moment$Moment>,
  ): Comparator<Row> {
    return (row1: Row, row2: Row) => {
      const data1 = dataExtractorFn(row1);
      const data2 = dataExtractorFn(row2);
      const moment1 = data1 instanceof Moment ? data1.momentView() : data1;
      const moment2 = data2 instanceof Moment ? data2.momentView() : data2;

      // handle the cases where the moments are invalid
      if (!moment1.isValid() && moment2.isValid()) {
        return -1;
      }
      if (moment1.isValid() && !moment2.isValid()) {
        return 1;
      }
      if (!moment1.isValid() && !moment2.isValid()) {
        return 0;
      }

      if (moment1.isAfter(moment2)) {
        return 1;
      }
      if (moment1.isBefore(moment2)) {
        return -1;
      }
      return 0;
    };
  },

  // Sort value pairs (a, b) such that if the a values are equal, then the b values are evaluated
  tuple<Row>(
    comparator1: Comparator<Row>,
    comparator2: Comparator<Row>,
  ): Comparator<Row> {
    return (row1: Row, row2: Row) => {
      const firstComparision = comparator1(row1, row2);
      return firstComparision !== 0
        ? firstComparision
        : comparator2(row1, row2);
    };
  },
};

export default TableSortUtil;
