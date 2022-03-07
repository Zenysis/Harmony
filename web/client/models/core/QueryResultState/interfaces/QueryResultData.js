// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import type QueryResultSpec from 'models/core/QueryResultSpec';

export interface QueryResultData<Self: Zen.AnyModel> {
  /**
   * Take the given customFields and apply their calculations to the
   * existing data
   * Argument:
   *   customFields: array of CustomField
   * Return:
   *   new QueryResultData instance with new calculated data
   */
  applyCustomFields(customFields: $ReadOnlyArray<CustomField>): Self;

  /**
   * Filter the stored query data using the provided filters.
   */
  applyFilters(filters: DataFilterGroup): Self;

  /**
   * Apply all post-query transformations to the stored queryResult. This
   * includes applying new CustomFields, filtering the query result, and
   * performing any additional modifications to the stored query result based
   * on the changes to the QueryResultSpec. If an implementing class does not
   * need to apply any extra behavior beyond calling `applyCustomFields` and
   * `applyFilters` they should use the `defaultApplyTransformations` function
   * exported alongside the interface.
   *
   */
  applyTransformations(queryResultSpec: QueryResultSpec): Promise<Self>;

  /**
   * Return true if there is no data returned, either due to filtering or no
   * data available from the backend.
   */
  isEmpty(): boolean;
}

/**
 * Simple method that transforms the QueryResultData instance based on changes
 * to the QueryResultSpec. First, `applyFilters` is called to limit the results
 * to only the set that passed the filter. Finally, `applyCustomFields` is
 * called to recalculate the custom fields the user has added.
 *
 * This method is useful for performing the required first steps of the
 * `applyTransformations` process. Most implementations should use this function
 * since it handles the basic tranformations. Then, if further customization is
 * needed by a QueryResultData instance, it can be applied after these
 * transformations.
 */
export function defaultApplyTransformations<
  QueryResultDataModel: Zen.AnyModel & QueryResultData<$AllowAny>,
>(
  initialQueryResult: QueryResultDataModel,
  queryResultSpec: QueryResultSpec,
): Promise<QueryResultDataModel> {
  const customFields = queryResultSpec.customFields();
  const dataFilters = queryResultSpec.dataFilters();

  let queryResult = initialQueryResult;
  if (customFields.length > 0) {
    queryResult = queryResult.applyCustomFields(customFields);
  }

  if (!dataFilters.isEmpty()) {
    queryResult = queryResult.applyFilters(dataFilters);
  }

  return Promise.resolve(queryResult);
}
