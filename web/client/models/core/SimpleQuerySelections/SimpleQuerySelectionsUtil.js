// @flow
import Promise from 'bluebird';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import AndFilter from 'models/core/wip/QueryFilter/AndFilter';
import CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import DimensionService from 'services/wip/DimensionService';
import DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import FieldService from 'services/wip/FieldService';
import GranularityService from 'services/wip/GranularityService';
import GroupingDimension from 'models/core/wip/GroupingItem/GroupingDimension';
import Moment from 'models/core/wip/DateTime/Moment';
import QuerySelections from 'models/core/wip/QuerySelections';
import SelectorFilter from 'models/core/wip/QueryFilter/SelectorFilter';
import { BACKEND_GRANULARITIES } from 'components/QueryResult/timeSeriesUtil';
import { getDimensionsForQuery } from 'components/visualizations/common/Query/util';
import { isEmpty } from 'util/util';
import type Dimension from 'models/core/wip/Dimension';
import type Field from 'models/core/wip/Field';
import type LegacyField from 'models/core/Field';
import type QuerySelectionFilter from 'models/core/SimpleQuerySelections/QuerySelectionFilter';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { QueryFilter } from 'models/core/wip/QueryFilter/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type LegacyGranularity = $Values<typeof BACKEND_GRANULARITIES>;

function _createDimensionSelectorFilter(
  dimensions: $ReadOnlyArray<Dimension>,
  filter: QuerySelectionFilter,
): QueryFilter {
  const filterValues = filter.criteria();
  const filters = dimensions.map(dimension =>
    SelectorFilter.create({
      dimension,
      value: (filterValues[dimension.id()]: any),
    }),
  );

  invariant(
    filters.length > 0,
    'All legacy dimension value filters must be non-empty.',
  );

  // Small optimization: avoid creating an AndFilter if we only have one value
  // to filter for.
  if (filters.length === 1) {
    return filters[0];
  }

  return AndFilter.create({
    fields: Zen.Array.create(filters),
  });
}

function _createDimensionValueFilter(
  filter: QuerySelectionFilter,
): Promise<DimensionValueFilterItem> {
  // The query form stores the geography filter's display value on top of the
  // original geography filter object. Remove these pieces.
  const filterValues = filter.criteria();
  const dimensionIDs = Object.keys(filterValues).filter(
    dimensionID => dimensionID !== '_display',
  );

  invariant(
    dimensionIDs.length > 0,
    'Legacy filter must contain at least one dimension ID to filter on.',
  );
  return Promise.all(dimensionIDs.map(DimensionService.get)).then(
    (dimensions: $ReadOnlyArray<Dimension>) => {
      const queryFilter = _createDimensionSelectorFilter(dimensions, filter);
      // Use the last dimension in the list as the dimension this DimensionValue
      // filters on.
      const representativeDimension = dimensions[dimensions.length - 1];
      const dimensionValue = DimensionValue.create({
        dimension: representativeDimension,
        filter: queryFilter,
        id: `${representativeDimension.id()}__filter`,
        name: representativeDimension.name(),
      });
      return DimensionValueFilterItem.createFromDimensionValues(dimensionValue);
    },
  );
}

// Convert the legacy filter representation into the new QueryFilter type.
function buildDimensionFilters(legacyFilter: {
  +[string]: QuerySelectionFilter | void,
}): Promise<Zen.Array<QueryFilterItem>> {
  const filterPromises: Array<Promise<QueryFilterItem>> = [];
  Object.keys(legacyFilter).forEach(dimensionCategory => {
    const filterModel = legacyFilter[dimensionCategory];
    if (filterModel === undefined) {
      return;
    }

    // If the filter object is a color filter, ignore it.
    const filterObj = filterModel.criteria();
    if (isEmpty(filterObj) || 'colorFilters' in filterObj) {
      return;
    }

    filterPromises.push(_createDimensionValueFilter(filterModel));
  });

  return Promise.all(filterPromises).then(values => Zen.Array.create(values));
}

function buildGroups(
  simpleQuerySelections: SimpleQuerySelections,
  granularityID: LegacyGranularity,
): Promise<Zen.Array<GroupingItem>> {
  // NOTE(stephen): SimpleQuerySelections.granularity is a misnomer. It does
  // not refer to a time granularity, it refers to the grouping dimension.
  const groupingDimensionID = simpleQuerySelections.granularity();

  // Expand the current grouping dimension into the full list of dimensions
  // needed for this query. In SQT, these dimensions are selected automatically
  // based on the single selected dimension (i.e. woreda -> [R, Z, W]).
  const promises = getDimensionsForQuery(simpleQuerySelections).map(
    dimensionID =>
      DimensionService.get(dimensionID).then((dimension: Dimension) =>
        GroupingDimension.create({
          dimension,
          // If this dimension is the one selected in the query form, we should
          // filter out null values since that is the default behavior of SQT.
          // Otherwise, null values are ok.
          includeNull: dimensionID !== groupingDimensionID,
          name: dimension.name(),
        }),
      ),
  );

  // Add in a time grouping if it is needed.
  if (granularityID !== BACKEND_GRANULARITIES.ALL) {
    promises.push(GranularityService.get(granularityID));
  }

  return Promise.all(promises).then(values => Zen.Array.create(values));
}

function buildFields(
  legacyFields: $ReadOnlyArray<LegacyField>,
): Promise<Zen.Array<Field>> {
  // NOTE(stephen): Denominators are deprecated and unsupported here.
  const promises = legacyFields.map(f => FieldService.get(f.id()));
  return Promise.all(promises).then(values => Zen.Array.create(values));
}

export default class QuerySelectionsUtil {
  /**
   * Convert a SimpleQuerySelections model into the more advanced
   * QuerySelections model.
   */
  static castToQuerySelections(
    simpleQuerySelections: SimpleQuerySelections,
    granularityID: LegacyGranularity = BACKEND_GRANULARITIES.ALL,
  ): Promise<QuerySelections> {
    const groupsPromise = buildGroups(simpleQuerySelections, granularityID);
    const dimensionFiltersPromise = buildDimensionFilters(
      simpleQuerySelections.filters(),
    );
    const timeFilter = CustomizableTimeInterval.createIntervalFromDates(
      Moment.create(simpleQuerySelections.startDate()),
      Moment.create(simpleQuerySelections.endDate()),
    );
    const fieldsPromise = buildFields(simpleQuerySelections.fields());
    return Promise.all([
      groupsPromise,
      dimensionFiltersPromise,
      fieldsPromise,
    ]).then(values => {
      // NOTE(stephen): Unpacking values directly since flow typing
      // Promise.all is having issues.
      const groups: Zen.Array<GroupingItem> = values[0];
      const dimensionFilters: Zen.Array<QueryFilterItem> = values[1];
      const fields: Zen.Array<Field> = values[2];
      return QuerySelections.create({
        fields,
        groups,
        filter: dimensionFilters.push(timeFilter),
      });
    });
  }
}
