// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilter from 'models/core/QueryResultSpec/QueryResultFilter/DataFilter';
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
  applyCustomFields(customFields: $ReadOnlyArray<CustomField>): Zen.Model<Self>;

  /**
   * Filter the stored query data using the provided filters.
   */
  applyFilters(filterMap: Zen.Map<DataFilter>): Zen.Model<Self>;

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
  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<Self>>;
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
export function defaultApplyTransformations<QueryResultDataModel: Zen.AnyModel>(
  initialQueryResult: QueryResultData<QueryResultDataModel>,
  queryResultSpec: QueryResultSpec,
): Promise<Zen.Model<QueryResultDataModel>> {
  const customFields = queryResultSpec.customFields();
  const filters = queryResultSpec.dataFilters();

  let queryResult = initialQueryResult;
  if (!filters.isEmpty()) {
    queryResult = queryResult.applyFilters(filters);
  }

  if (customFields.length > 0) {
    queryResult = queryResult.applyCustomFields(customFields);
  }

  return Promise.resolve(queryResult);
}
