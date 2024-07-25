// @flow
import * as Zen from 'lib/Zen';
import DataFilter from 'models/core/QueryResultSpec/DataFilter';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  filters: Zen.Array<{
    +fieldId: string,
    +filter: DataFilter,
  }>,
};

type SerializedDataFilterGroup = $ReadOnlyArray<{
  +fieldId: string,
  ...Zen.Serialized<DataFilter>,
}>;

function _isFilterableValue(value: mixed): boolean %checks {
  return typeof value === 'number' || value === undefined || value === null;
}

/**
 * This represents an array of filters to be applied on query result data
 * on the frontend. The data filters are applied sequentially.
 */
class DataFilterGroup extends Zen.BaseModel<DataFilterGroup, {}, DefaultValues>
  implements Serializable<SerializedDataFilterGroup> {
  static defaultValues: DefaultValues = {
    filters: Zen.Array.create(),
  };

  static deserialize(
    fieldFilters: SerializedDataFilterGroup,
  ): Zen.Model<DataFilterGroup> {
    const dataFilters = fieldFilters.map(
      ({ fieldId, ...serializedDataFilter }) => ({
        fieldId,
        filter: DataFilter.deserialize(serializedDataFilter),
      }),
    );

    return DataFilterGroup.create({
      filters: Zen.Array.create(dataFilters),
    });
  }

  isEmpty(): boolean {
    return this._.filters().isEmpty();
  }

  /**
   * Apply this filter as a row-wise operation to an array of dictionaries that
   * map a field id to a value.
   *
   * Each filter will be tested against the value corresponding to the field id
   * we are filtering on, but if we have to remove the value then we remove
   * the *entire* row.
   *
   * Rows with non-number values are allowed, but a `valueExtractor` will need
   * to be provided that tells us how to extract a number from this row given
   * a key.
   */
  /* ::
   +filterRows: ((
     rows: $ReadOnlyArray<{ +[fieldId: string]: ?number, ... }>
   ) => $ReadOnlyArray<{ +[fieldId: string]: ?number, ... }>) & <T: { ... }>(
     rows: $ReadOnlyArray<T>,
     valueExtractor: (row: T, key: string) => ?number,
   ) => $ReadOnlyArray<T>;
   */
  filterRows(
    rows: $ReadOnlyArray<{ +[fieldId: string]: ?number, ... }>,
    valueExtractor?: (row: { ... }, key: string) => ?number,
  ): $ReadOnlyArray<{ ... }> {
    if (this.isEmpty()) {
      return rows;
    }

    return this._.filters().reduce((currRows, { fieldId, filter }) => {
      const allValues = currRows.map(row => {
        const val = row[fieldId];
        if (fieldId in row && _isFilterableValue(val)) {
          return val;
        }

        if (valueExtractor !== undefined) {
          return valueExtractor(row, fieldId);
        }

        throw new Error(
          `Encountered an unfilterable value on ${fieldId}, and no valueExtractor was provided.`,
        );
      });

      return currRows.filter((_, i) =>
        filter.shouldValueBeKept(allValues[i], allValues),
      );
    }, rows);
  }

  /**
   * Tests if a single value should be kept
   */
  shouldValueBeKept(val: ?number, allValues: $ReadOnlyArray<?number>): boolean {
    // we only keep the value if every filter decided to keep it
    return this._.filters().every(({ filter }) =>
      filter.shouldValueBeKept(val, allValues),
    );
  }

  /**
   * Remove all the filters that apply to a given field id
   */
  removeFiltersForField(fieldIdToRemove: string): Zen.Model<DataFilterGroup> {
    return this.removeFiltersForFields(new Set([fieldIdToRemove]));
  }

  /**
   * Remove all the filters that apply to any fields in a given set of fieldIds
   */
  removeFiltersForFields(
    fieldIdsToRemove: Set<string>,
  ): Zen.Model<DataFilterGroup> {
    const filters = this._.filters();
    return this._.filters(
      filters.filter(({ fieldId }) => !fieldIdsToRemove.has(fieldId)),
    );
  }

  serialize(): SerializedDataFilterGroup {
    return this._.filters().mapValues(({ fieldId, filter }) => ({
      fieldId,
      ...filter.serialize(),
    }));
  }
}

export default ((DataFilterGroup: $Cast): Class<Zen.Model<DataFilterGroup>>);
