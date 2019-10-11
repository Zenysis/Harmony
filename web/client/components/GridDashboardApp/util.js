// @flow
import * as Zen from 'lib/Zen';
import DashboardDateRange, {
  SELECTIONS_DATE_FORMAT,
} from 'models/core/Dashboard/DashboardSpecification/DashboardDateRange';
import DashboardFilter from 'models/core/Dashboard/DashboardSpecification/DashboardFilter';
import DashboardItemSettings from 'models/core/Dashboard/DashboardSpecification/DashboardItemSettings';
import DashboardQuery from 'models/core/Dashboard/DashboardSpecification/DashboardQuery';
import DashboardSpecification from 'models/core/Dashboard/DashboardSpecification';
import Moment from 'models/core/wip/DateTime/Moment';
import QueryResultSpec from 'models/core/QueryResultSpec';
import RelationalDashboardQuery from 'models/core/Dashboard/DashboardSpecification/RelationalDashboardQuery';
import ZenArray from 'util/ZenModel/ZenArray';
import { FIELD_OPTIONS } from 'backend_config';
import { arrayEquality } from 'util/util';
import type CustomField from 'models/core/Field/CustomField';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

// Build a new QueryResultSpec from a specific dashboard item.
export function buildQueryResultSpec(query: DashboardQuery) {
  // TODO(pablo): refactor this, this is redundant (having to serialize
  // things to then immediately deserialize again).
  const settings = query.setting().serialize();

  return QueryResultSpec.deserializeFromDashboard(
    {
      query: query.serialize(),
      settings,
    },
    { isAdvancedQueryItem: query.isAdvancedQueryItem() },
  );
}

function fieldsHaveChanged(
  oldSelection: Zen.Serialized<SimpleQuerySelections>,
  newSelection: Zen.Serialized<SimpleQuerySelections>,
): boolean {
  return Object.keys(FIELD_OPTIONS).some((field: string) => {
    const oldValue = oldSelection[field] || [];
    const newValue = newSelection[field] || [];
    return !arrayEquality(oldValue, newValue);
  });
}

export function updateVisualizationCustomField(
  specification: DashboardSpecification,
  queryId: string,
  customFields: $ReadOnlyArray<CustomField>,
): DashboardSpecification {
  const query: DashboardQuery = specification
    .relationalQueries()
    .forceGet(queryId);

  // TODO(pablo): we shouldn't have to convert to a ZenArray here.
  // QueryResultSpec should be holding ZenArrays to being with.
  const updatedQuery: DashboardQuery = query.customFields(
    ZenArray.create(customFields),
  );

  return specification
    .deepUpdate()
    .relationalQueries()
    .set(queryId, updatedQuery);
}

export function updateVisualizationFilters(
  specification: DashboardSpecification,
  queryId: string,
  newFilters: { [key: string]: any },
  optionsSelected: { [key: string]: any },
): DashboardSpecification {
  let query: DashboardQuery = specification
    .relationalQueries()
    .forceGet(queryId);

  query = query.frontendSelectionsFilter(newFilters);
  query = query.filterModalSelections(optionsSelected);

  return specification
    .deepUpdate()
    .relationalQueries()
    .set(query.id(), query);
}

export function updateVisualizationSettings(
  specification: DashboardSpecification,
  queryId: string,
  newSettings: DashboardItemSettings,
) {
  let newSpecification: DashboardSpecification = specification;
  let query: RelationalDashboardQuery = specification
    .relationalQueries()
    .forceGet(queryId);

  const settingId: string = query.settingId()
    ? query.settingId()
    : `${queryId}_settings`;
  query = query.settingId(settingId);

  const updatedSettings = DashboardItemSettings.create({
    ...newSettings.modelValues(),
    id: settingId,
  });

  newSpecification = newSpecification
    .deepUpdate()
    .settings()
    .set(updatedSettings.id(), updatedSettings);

  newSpecification = newSpecification
    .deepUpdate()
    .relationalQueries()
    .set(query.id(), query);

  return newSpecification;
}

/**
 * Apply changes to specification given a new simple query selections
 * @param {*} visualization
 * @param {*} selections
 * @param {*} specification
 * @param {*} viewType
 */
export function updateSimpleVisualizationQuery(
  dashboardQuery: DashboardQuery,
  newSelections: SimpleQuerySelections,
  specification: DashboardSpecification,
  viewType?: ResultViewType,
): DashboardSpecification {
  const legacySelections = newSelections.legacySelections();
  let newSpecification = specification;

  // Changing the dashboard specification to match the new selections.
  // fields, viewtype, dateRange, and granularity
  // need be dealt with seperately.
  const dateRange = dashboardQuery.dateRange();
  const newStartDate = Moment.create(
    legacySelections.startDate,
    SELECTIONS_DATE_FORMAT,
  );
  const newEndDate = Moment.create(
    legacySelections.endDate,
    SELECTIONS_DATE_FORMAT,
  );
  const newDateType = legacySelections.dateType;

  const visualizationTypeChanged =
    viewType && dashboardQuery.type() !== viewType;
  const granularityChanged =
    dashboardQuery.groupBy() !== legacySelections.granularity;
  const datesChanged = !(
    dateRange.startDate().isSame(newStartDate) &&
    dateRange.endDate().isSame(newEndDate) &&
    dateRange.dateType() === newDateType
  );
  const filtersChanged =
    dashboardQuery.frontendSelectionsFilter() !== legacySelections.filters;
  const fieldsChanged = fieldsHaveChanged(
    dashboardQuery.legacySelection(),
    legacySelections,
  );

  if (
    visualizationTypeChanged ||
    granularityChanged ||
    filtersChanged ||
    fieldsChanged
  ) {
    // The query itself has changed.
    let newQuery: DashboardQuery = newSpecification
      .relationalQueries()
      .forceGet(dashboardQuery.id());
    if (visualizationTypeChanged) {
      newQuery = newQuery.type(viewType);
    }
    if (granularityChanged) {
      newQuery = newQuery.groupBy(newSelections.granularity());
    }
    if (filtersChanged) {
      const newFilters = Object.assign(
        {},
        dashboardQuery.frontendSelectionsFilter(),
        legacySelections.filters,
      );
      // Override geography filter if it doesn't exist in new filters.
      if (!Object.prototype.hasOwnProperty.call(newFilters, 'geography')) {
        newFilters.geography = {};
      }
      newQuery = newQuery.frontendSelectionsFilter(newFilters);
    }
    if (fieldsChanged) {
      let filterCount = 0;
      const newFilters: Array<DashboardFilter> = [];
      Object.keys(legacySelections).forEach((key: string) => {
        if (FIELD_OPTIONS[key] && legacySelections[key]) {
          // TODO(vedant, moriah) - This is horrible. We are creating a generic
          // filter for the `field` dimension but are also creating a specific
          // filter for the FIELD_OPTION that this `field` corresponds to.
          // Figure out how we can avoid creating two filters for each
          // indicator group.
          const genericFilter: DashboardFilter = DashboardFilter.create({
            id: `filter_${newQuery.id()}_${filterCount}`,
            filterOn: 'field',
            filterValues: ZenArray.create(legacySelections[key]),
          });
          ++filterCount;

          const specificFilter: DashboardFilter = DashboardFilter.create({
            id: `filter_${newQuery.id()}_${filterCount}`,
            filterOn: key,
            filterValues: ZenArray.create(legacySelections[key]),
          });
          ++filterCount;
          newFilters.push(genericFilter);
          newFilters.push(specificFilter);
          newSpecification = newSpecification
            .deepUpdate()
            .filters()
            .set(genericFilter.id(), genericFilter);
          newSpecification = newSpecification
            .deepUpdate()
            .filters()
            .set(specificFilter.id(), specificFilter);
        }
      });
      const zenFilters: ZenArray<DashboardFilter> = ZenArray.create(newFilters);

      newQuery = newSpecification
        .relationalQueries()
        .forceGet(newQuery.id())
        .filters(zenFilters.map((filter: DashboardFilter) => filter.id()));
    }
    newSpecification = newSpecification
      .deepUpdate()
      .relationalQueries()
      .set(newQuery.id(), newQuery);
  }

  // Dates are represented relationally, which means that if dates change,
  // only the mapping dateRanges need to be directly updated.
  if (datesChanged) {
    const newDateRange: DashboardDateRange = DashboardDateRange.create({
      id: dateRange.id(),
      dateType: newDateType,
      startDate: newStartDate,
      endDate: newEndDate,
    });
    newSpecification = newSpecification
      .deepUpdate()
      .dateRanges()
      .set(newDateRange.id(), newDateRange);
  }

  return newSpecification;
}

// $CycloneIdaiHack
// TODO(pablo): clean up the editing of queries instead of duplicating an
// update function for SQT and AQT. This will involve refactoring the dashboard
// spec representation to work directly with query selections, instead of the
// unintuitive representation we are currently where duplicate data is held in
// several different models. This fix is gonna be part of an ongoing larger
// refactor of our DashboardSpec ZenModels, and how it's represented in the
// backend.
/**
 * Apply changes to specification given new query selections
 * @param {*} visualization
 * @param {*} selections
 * @param {*} specification
 * @param {*} viewType
 */
export function updateAdvancedVisualizationQuery(
  dashboardQuery: DashboardQuery,
  newSelections: QuerySelections,
  specification: DashboardSpecification,
  viewType?: ResultViewType,
): DashboardSpecification {
  let newSpecification = specification;

  // get the new filters, fields, and groups
  // NOTE(pablo): updating an edited AQT query is easier than SQT because
  // for AQT we are not storing their filters, fields, or groups as part of the
  // top-level dashboard spec maps. So we only have to update the relevant
  // DashboardItem and RelationalDashboardQuery models, and don't
  // have to go through the trouble of updating the top-level maps (e.g.
  // the filter maps, date range maps, etc.). Eventually this will change.
  const { filter, fields, groups } = newSelections.modelValues();

  // If the viewType changed use the new one.
  const newViewType = viewType || dashboardQuery.type();

  const newQuery: DashboardQuery = newSpecification
    .relationalQueries()
    .forceGet(dashboardQuery.id())
    .modelValues({
      type: newViewType,
      advancedFilters: filter,
      advancedGroups: groups,
      advancedFields: fields,
    });
  newSpecification = newSpecification
    .deepUpdate()
    .relationalQueries()
    .set(newQuery.id(), newQuery);

  return newSpecification;
}
