// @flow
import Field from 'models/core/wip/Field';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import type CustomField from 'models/core/Field/CustomField';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
/**
 * Get an array of fields given a query result spec and the query result.
 * This function ensures that the fields we export remain in the same order
 * that we specify in the series settings.
 */
export default function getFieldsFromQueryResultSpec(
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections,
): Array<Field | CustomField> {
  const seriesSettings = queryResultSpec.getSeriesSettings(
    RESULT_VIEW_TYPES.TABLE,
  );
  const seriesOrder = seriesSettings.seriesOrder();
  const fieldsSeen = new Set();
  const selectionsFields = querySelections.fields().arrayView();
  const output = [];

  seriesOrder.forEach(id => {
    if (fieldsSeen.has(id) === undefined) {
      return;
    }

    const seriesField = selectionsFields.find(field => field.id() === id);

    if (seriesField !== undefined) {
      output.push(seriesField);
      fieldsSeen.add(id);
      return;
    }

    const seriesCustomField = queryResultSpec
      .customFields()
      .find(field => field.id() === id);

    if (seriesCustomField !== undefined) {
      output.push(seriesCustomField);
      fieldsSeen.add(id);
    }
  });
  return output;
}
