// @flow
import * as Zen from 'lib/Zen';
import DataFilterAction from 'models/core/QueryResultSpec/ValueAction/DataFilterAction';
import { range } from 'util/util';
import type { FieldFilterSelections } from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/types';

type Values = {
  fieldId: string,
  filters: Zen.Array<DataFilterAction>,
};

/**
 * This represents a filter to be applied on query result data on the frontend.
 */
class DataFilter extends Zen.BaseModel<DataFilter, Values> {
  static createFromFilterModalSelections(
    filterModalSelections: FieldFilterSelections,
    fieldId: string,
  ): Zen.Model<DataFilter> {
    const { numRangeOptionsInputs } = filterModalSelections;

    const filters = [];
    range(numRangeOptionsInputs).forEach(idx => {
      const filterRule = filterModalSelections[idx];
      if (filterRule !== undefined) {
        const filterAction = DataFilterAction.createFromFilterModalSelections(
          filterRule,
        );
        if (filterAction !== undefined) {
          filters.push(filterAction);
        }
      }
    });

    return DataFilter.create({
      fieldId,
      filters: Zen.Array.create(filters),
    });
  }

  /**
   * Apply this filter as a row-wise operation to an array of dictionaries that
   * map a field id to a value.
   *
   * Each filter will be tested against the value corresponding to the field id
   * we are filtering on, but if we have to remove the value then we remove
   * the *entire* row.
   */
  filterRows(
    rows: Array<{ [fieldId: string]: ?number }>,
  ): Array<{ [fieldId: string]: ?number }> {
    const { fieldId, filters } = this.modelValues();

    return filters.reduce((currRows, filter) => {
      // first collect all values for this fieldId
      const allValues = currRows.map(obj => obj[fieldId]);

      // now keep all the rows that pass the filter for this fieldId
      return currRows.filter(row =>
        filter.shouldValueBeKept(row[fieldId], allValues),
      );
    }, rows);
  }

  /**
   * Tests if a single value should be kept
   */
  shouldValueBeKept(val: ?number, allValues: $ReadOnlyArray<?number>): boolean {
    // we only keep the value if none of the filters removed it
    return this._.filters().every(filter =>
      filter.shouldValueBeKept(val, allValues),
    );
  }
}

export default ((DataFilter: any): Class<Zen.Model<DataFilter>>);
