// @flow
import * as Zen from 'lib/Zen';
import ColorFilter from 'models/core/QueryResultSpec/QueryResultFilter/ColorFilter';
import DataFilter from 'models/core/QueryResultSpec/QueryResultFilter/DataFilter';
import type QueryResultSpec from 'models/core/QueryResultSpec';

export function computeColorFilters(
  queryResultSpec: QueryResultSpec,
): Zen.Map<ColorFilter> {
  return Zen.Map.create(queryResultSpec.modalFilters()).map(
    (filterModalSelections, fieldId) =>
      ColorFilter.createFromFilterModalSelections(
        filterModalSelections,
        fieldId,
      ),
  );
}

export function computeDataFilters(
  queryResultSpec: QueryResultSpec,
): Zen.Map<DataFilter> {
  return Zen.Map.create(queryResultSpec.modalFilters()).map(
    (filterModalSelections, fieldId) =>
      DataFilter.createFromFilterModalSelections(
        filterModalSelections,
        fieldId,
      ),
  );
}
