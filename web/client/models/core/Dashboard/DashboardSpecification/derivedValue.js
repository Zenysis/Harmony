// @flow
import DashboardDateRange from 'models/core/Dashboard/DashboardSpecification/DashboardDateRange';
import DashboardFilter from 'models/core/Dashboard/DashboardSpecification/DashboardFilter';
import DashboardItemSettings from 'models/core/Dashboard/DashboardSpecification/DashboardItemSettings';
import DashboardQuery from 'models/core/Dashboard/DashboardSpecification/DashboardQuery';
import DashboardSpecification from 'models/core/Dashboard/DashboardSpecification';
import RelationalDashboardQuery from 'models/core/Dashboard/DashboardSpecification/RelationalDashboardQuery';
import ZenArray from 'util/ZenModel/ZenArray';
import ZenMap from 'util/ZenModel/ZenMap';

/**
 * Recomputes the mapping of 'rich' queries in the Dashboard if any of the
 * constituent fields of the DashboardSpecification change.
 *
 * @param {DashboardSpecification} currentSpecification
 * The new Dashboard specification.
 *
 * @param {DashboardSpecification} previousSpecification
 * The old Dashboard specification.
 *
 * @returns {ZenMap<DashboardQuery>}
 * The updated 'rich' query mapping based on the changes that took place in
 * the Dashboard Specification.
 */
export function recomputeQueries(
  currentSpecification: DashboardSpecification,
  previousSpecification: DashboardSpecification,
): ZenMap<DashboardQuery> {
  let noChanges = previousSpecification;
  const newQueries: ZenMap<DashboardQuery> = currentSpecification
    .relationalQueries()
    .reduce(
      (
        _newQueries: ZenMap<DashboardQuery>,
        query: RelationalDashboardQuery,
      ) => {
        // Try and get the previously computed item from the specification
        // (if it exists)
        const previousItem: DashboardQuery | void = previousSpecification
          ? previousSpecification.queries().get(query.id())
          : undefined;
        const queryParameters = query.modelValues();

        const dateRangeModel: DashboardDateRange | void = currentSpecification
          .dateRanges()
          .get(query.dateRange());
        const filterModels: ZenArray<DashboardFilter> = query
          .filters()
          .map((filterId: string) =>
            currentSpecification.filters().forceGet(filterId),
          );

        const settingsModel: DashboardItemSettings | void = currentSpecification
          .settings()
          .get(query.settingId());

        // Compare the previous item's dateRange objects. Check to see if they
        // are equal to the current object instances before doing any
        // additional computations.
        let itemUnchanged =
          previousItem !== undefined &&
          settingsModel === previousItem.setting() &&
          dateRangeModel === previousItem.dateRange() &&
          query.groupBy() === previousItem.groupBy() &&
          query.name() === previousItem.name();

        if (itemUnchanged) {
          // Flow is not able to determine that I have already checked to
          // ensure that the value is NOT undefined

          // Verify that the size of the previous Query Filters object is the
          // same as the current filter object.
          const previousFilters: ZenArray<DashboardFilter> =
            // $FlowFixMe
            previousItem.filters();
          if (previousFilters.size() === filterModels.size()) {
            // Make sure that EACH filter model from the current query filter
            // was present in the previously computed value.
            filterModels.forEach((filter: DashboardFilter) => {
              if (itemUnchanged) {
                itemUnchanged =
                  itemUnchanged &&
                  // $FlowFixMe
                  previousItem.filters().includes(filter);
              }
            });
          }
        }

        if (!itemUnchanged) {
          queryParameters.filters = filterModels;
          queryParameters.dateRange = dateRangeModel;
          queryParameters.setting = settingsModel;
        }

        noChanges = noChanges && itemUnchanged;

        // $FlowFixMe
        const newItem: DashboardQuery = itemUnchanged
          ? previousItem
          : DashboardQuery.create(queryParameters);
        return _newQueries.set(newItem.id(), newItem);
      },
      ZenMap.create(),
    );

  return newQueries;
}
