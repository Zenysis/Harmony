// @flow
import Moment from 'models/core/wip/DateTime/Moment';

type DataExtractor<Row, T> = (row: Row) => T;
type Comparator<Row> = (Row, Row) => number;

// a collection of helper functions to easily sort different types
// All sort functions default to being an ascending order sort.
const TableSortUtil = {
  string<Row>(dataExtractorFn: DataExtractor<Row, string>): Comparator<Row> {
    return (row1: Row, row2: Row) =>
      dataExtractorFn(row1).localeCompare(dataExtractorFn(row2));
  },

  number<Row>(dataExtractorFn: DataExtractor<Row, number>): Comparator<Row> {
    return (row1: Row, row2: Row) =>
      dataExtractorFn(row1) - dataExtractorFn(row2);
  },

  boolean<Row>(dataExtractorFn: DataExtractor<Row, boolean>): Comparator<Row> {
    return (row1: Row, row2: Row) =>
      Number(dataExtractorFn(row1)) - Number(dataExtractorFn(row2));
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
};

export default TableSortUtil;
