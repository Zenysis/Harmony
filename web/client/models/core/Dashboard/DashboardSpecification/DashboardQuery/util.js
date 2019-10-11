// @flow
import DashboardDateRange, {
  SELECTIONS_DATE_FORMAT,
} from 'models/core/Dashboard/DashboardSpecification/DashboardDateRange';
import DashboardFilter from 'models/core/Dashboard/DashboardSpecification/DashboardFilter';
import RelationalDashboardQuery from 'models/core/Dashboard/DashboardSpecification/RelationalDashboardQuery';
import ZenError from 'util/ZenError';
import { FIELD_OPTIONS } from 'backend_config';
import { GroupLookup, IndicatorLookup } from 'indicator_fields';

// TODO(vedant) - Kill this function. We have it here for now but we should
// figure out how to generate a QuerySelections/QueryResultSpec without it.
// eslint-disable-next-line import/prefer-default-export
export function computeLegacySelection(
  newQuery: RelationalDashboardQuery,
  previousQuery: RelationalDashboardQuery,
) {
  if (newQuery.isAdvancedQueryItem()) {
    return undefined;
  }

  const noChanges =
    previousQuery &&
    previousQuery === newQuery &&
    previousQuery.frontendSelectionsFilter() ===
      newQuery.frontendSelectionsFilter();

  if (noChanges) {
    return previousQuery.legacySelection();
  }

  const frontendSelectionsFilter = newQuery.frontendSelectionsFilter();
  const dateRange: DashboardDateRange | void = newQuery.dateRange();
  const options = {};
  Object.keys(FIELD_OPTIONS).forEach((fieldOption: string) => {
    options[fieldOption] = [];
    if (fieldOption === FIELD_OPTIONS.denominator) {
      options[fieldOption] = '';
    }
  });
  const seenFields = new Set();
  newQuery.filters().forEach((filter: DashboardFilter) => {
    filter.filterValues().forEach((fieldValue: string) => {
      // HACK(moriah): Because queried indicators are stored in the
      // dashboard type as their selection type and as type field we need
      // to avoid add duplicated fields.
      // HACK(moriah): Geography filters have been mistakenly added to
      // magicFilters, for no aparent reason. This reduces errors due to that.
      // It will also remove fields that refer to old indicator ids.
      if (IndicatorLookup[fieldValue] === undefined) {
        console.error(
          'Magic filter refers to a value',
          'that is not an Indicator:',
          fieldValue,
        );
        return;
      }
      if (seenFields.has(fieldValue)) {
        return;
      }
      seenFields.add(fieldValue);
      options.fields.push(fieldValue);
      // NOTE(moriah, stephen): Only supporting legacy denominators
      // for old dashboards which are no longer selectable.
      if (filter.filterOn() === FIELD_OPTIONS.denominator) {
        options.denominator = filter.filterValues().first();
        return;
      }
      const { groupId } = IndicatorLookup[fieldValue];
      const { selectionType } = GroupLookup[groupId];
      options[selectionType].push(fieldValue);
    });
  });

  if (dateRange === undefined) {
    throw new ZenError(
      '[RelationalDashboardQuery/util] You cannot create legacy selections without a date range.',
    );
  }

  // TODO(vedant) - frontEndSelections should be written to the settings
  // object and not the layout item.
  const selection = {
    dateType: dateRange.dateType(),
    granularity: newQuery.groupBy(),
    startDate: dateRange.startDate().format(SELECTIONS_DATE_FORMAT),
    endDate: dateRange.endDate().format(SELECTIONS_DATE_FORMAT),
    filters: frontendSelectionsFilter,
    _title: undefined,
  };

  Object.keys(options).forEach(option => {
    selection[option] = options[option];
  });
  return selection;
}
