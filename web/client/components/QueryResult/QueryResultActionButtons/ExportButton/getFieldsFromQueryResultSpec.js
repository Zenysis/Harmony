// @flow
import LegacyField from 'models/core/Field';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/common';
import type QueryResultSpec from 'models/core/QueryResultSpec';
/**
 * Get an array of fields given a query result spec and the query result.
 * This function ensures that the fields we export remain in the same order
 * that we specify in the series settings.
 */
export default function getFieldsFromQueryResultSpec(
  queryResultSpec: QueryResultSpec,
): Array<LegacyField> {
  const seriesSettings = queryResultSpec.getSeriesSettings(
    RESULT_VIEW_TYPES.TABLE,
  );
  const seriesOrder = seriesSettings.seriesOrder();
  const seriesObjects = seriesSettings.seriesObjects();
  const fields = {};

  // Store the full series ID order as a set in case multiple fields have
  // "show constituents" enabled and they have overlapping constituents.
  const fullSeriesOrder: Set<string> = new Set();
  seriesOrder.forEach(id => {
    if (fields[id] === undefined) {
      fields[id] = LegacyField.create({
        id,
        label: seriesObjects[id].label(),
      });
    }
    fullSeriesOrder.add(id);
    if (seriesObjects[id].showConstituents()) {
      const field = fields[id];
      field.constituents().forEach(f => {
        fullSeriesOrder.add(f.id());
        fields[f.id()] = f;
      });
    }
  });

  const output = [];
  fullSeriesOrder.forEach(id => output.push(fields[id]));
  return output;
}
