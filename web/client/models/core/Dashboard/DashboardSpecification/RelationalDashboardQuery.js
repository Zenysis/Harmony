// @flow
import PropTypes from 'prop-types';

import * as Zen from 'lib/Zen';
import CustomField from 'models/core/Field/CustomField';
import CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import Dimension from 'models/core/wip/Dimension';
import DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import Field from 'models/core/wip/Field';
import Granularity from 'models/core/wip/Granularity';
import GroupingItemUtil from 'models/core/wip/GroupingItem/GroupingItemUtil';
import QueryFilterItemUtil from 'models/core/wip/QueryFilterItem/QueryFilterItemUtil';
import ZenArray from 'util/ZenModel/ZenArray';
import ZenModel, { def } from 'util/ZenModel';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import { override } from 'decorators';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { SerializedCustomField } from 'models/core/Field/CustomField';
import type { SerializedGroupingItem } from 'models/core/wip/GroupingItem/types';
import type { SerializedQueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

const GroupingItemPropType = PropTypes.oneOfType([
  PropTypes.instanceOf(Dimension),
  PropTypes.instanceOf(Granularity),
]);

const FilterItemPropType = PropTypes.oneOfType([
  PropTypes.instanceOf(DimensionValue),
  PropTypes.instanceOf(CustomizableTimeInterval),
]);

// Model representation that we receive from the backend
export type SerializedDashboardQuery = {
  advancedFields: Array<Zen.Serialized<Field>>,
  advancedFilters: Array<SerializedQueryFilterItem>,
  advancedGroups: Array<SerializedGroupingItem>,
  dateRangeId: string,
  groupBy: string,
  id: string,
  magicFilters: Array<string>,
  name: string,

  itemId: string,
  customFields: Array<SerializedCustomField>,
  frontendSelectionsFilter: { [key: string]: any },
  filterModalSelections: { [key: string]: any },
  isAdvancedQueryItem: boolean,
  settingId: string,
  type: ResultViewType,
};

/**
 * The RelationalDashboardQuery model represents a query in a Dashboard
 * specification. It is the authoritative source from which the non-relational
 * `DashboardQuery` may be derived and can be edited directly. However, unlike
 * its non-relational counterpart, it only contains `id` references to its
 * constiuent filters and dateRange models.
 */
export default class RelationalDashboardQuery extends ZenModel.withTypes({
  /**
   * All Fields used in the query.
   * TODO(pablo): implement deserialization for advancedFields, advancedFilters
   * and advancedGroups
   * TODO(pablo, vedant): eventually all dashboard queries should be updated
   * to use these field models instead of using the `filters` property to
   * store the fields we're querying for. At that point we should rename
   * this to `fields`.
   */
  advancedFields: def(ZenArray.of(Field).isRequired, ZenArray.create()),

  /**
   * All filters applied to the query.
   * TODO(pablo, vedant): eventually all dashboard queries should be updated
   * to use an array of QueryFilterItem models. At that point this should be
   * renamed to `filters`.
   */
  advancedFilters: def(
    ZenArray.of(FilterItemPropType).isRequired,
    ZenArray.create(),
  ),

  /**
   * All dimensions the query will group by
   * TODO(pablo, vedant): eventually all dashboard queries should be updated
   * to use an array of groupBy Dimensions. At that point we can remove the
   * `groupBy` property and just rename this to `groups`.
   */
  advancedGroups: def(
    ZenArray.of(GroupingItemPropType).isRequired,
    ZenArray.create(),
  ),

  /**
   * The 'id' of the `DashboardDateRange` object that indicates what
   * date range this query will return results for.
   *
   * NOTE: A `DashboardDateRange` model with the specified 'id' value MUST be
   * defined in the parent specification otherwise any updates will be
   * rejected.
   */
  dateRange: def(PropTypes.string.isRequired),

  /**
   * The aggregation level at which the results for the query will be grouped
   * at.
   * (e.g. 'RegionName', 'subrecipient', 'ProvinceName', etc.)
   */
  groupBy: def(PropTypes.string.isRequired),

  /**
   * @readonly
   * The string representation of the unique id that corresponds to this
   * individual dashboard query instance.
   */
  id: def(PropTypes.string.isRequired, undefined, ZenModel.PRIVATE),

  /**
   * An enumeration of 'id's corresponding to the 'id' of individual
   * `DashboardFilter` objects that determine which dimensions and
   * individual values the query will return results for.
   *
   * NOTE: `DashboardFilter` models with the specified 'id' values MUST be
   * defined in the parent specification otherwise any updates will be
   * rejected.
   *
   * TODO(pablo, vedant); eventually this should be changed to use the
   * `advancedFilters` property, which contains a better representation of
   * QueryFilters. Also, we shouldn't be storing fields in this array. The
   * fields should be stored in the `advancedFields` array (to be later
   * renamed to `fields`).
   */
  filters: def(ZenArray.of(PropTypes.string).isRequired, ZenArray.create()),

  /**
   * An (optional) human-readable name to describe or identify to the user what
   * data this query returns results for.
   */
  name: def(PropTypes.string, ''),

  // TODO(moriah) - Move this OUT of the RelationalDashboardQuery class and
  // into its own top-level field in the Dashboard Specification.
  // customFields is only relevant to the frontend,
  // so we should have a different model to hold that information.
  customFields: def(
    ZenArray.of(CustomField).isRequired,
    ZenArray.ofType(CustomField).create(),
  ),

  // TODO(moriah) - Move this OUT of the RelationalDashboardQuery class and into
  // its own top-level field in the Dashboard Specification.
  // frontendSelectionsFilter is only relevant to the frontend,
  // so we should have a different model to hold that information.
  // TODO(vedant) - Come up with a structure AND a model for this.
  // TODO(vedant) - Unify `frontendSelectionsFilter` and `filterModalSelections`
  // since they contain virtually the exact same data
  frontendSelectionsFilter: def(PropTypes.object.isRequired, {}),

  // TODO(vedant) - Come up with a structure AND a model for this.
  filterModalSelections: def(PropTypes.object.isRequired, {}),

  // *
  //  * Boolean flag to on whether this dashboard item was produced by our
  //  * Advanced Query Tool. If it is, then certain operations cannot be
  //  * supported on the dashboard yet (such as Edit).
  //  * TODO(pablo): implement deserialization for this item

  isAdvancedQueryItem: def(PropTypes.bool.isRequired, false),

  /**
   * The 'id' of the `DashboardItemSetting` object that indicates what
   * visualization customizations will be applied to this dashboard item.
   *
   * TODO(moriah): This will also be moved when settings is moved into its own
   * top level model and away from thebackend specific model.
   * NOTE: A `DashboardItemSetting` model with the specified 'id' value MUST be
   * defined in the parent specification otherwise any updates will be
   * rejected.
   */
  settingId: def(PropTypes.string),

  /**
   * The type of visualization to render.
   */
  type: def(PropTypes.oneOf(Object.keys(RESULT_VIEW_TYPES)).isRequired),

  /**
   * The dashboard item id corresponding to the query.
   */
  itemId: def(PropTypes.string.isRequired),
}) {
  @override
  static deserializeAsync(
    values: SerializedDashboardQuery,
    extraConfig: { seriesSettings: SeriesSettings },
  ): Promise<RelationalDashboardQuery> {
    const {
      advancedFields,
      advancedFilters,
      advancedGroups,
      dateRangeId,
      groupBy,
      id,
      magicFilters,
      name,

      customFields,
      frontendSelectionsFilter,
      filterModalSelections,
      isAdvancedQueryItem,
      settingId,
      type,
      itemId,
    } = values;

    const fieldPromises = Promise.all(
      advancedFields.map(Field.deserializeAsync),
    );
    const filterPromises = Promise.all(
      advancedFilters.map(QueryFilterItemUtil.deserializeAsync),
    );
    const groupByPromises = Promise.all(
      advancedGroups.map(GroupingItemUtil.deserializeAsync),
    );

    const customFieldModels: Array<CustomField> = customFields
      ? customFields.map((rawObject: SerializedCustomField) =>
          CustomField.deserialize(rawObject, extraConfig),
        )
      : [];

    return Promise.all([fieldPromises, filterPromises, groupByPromises]).then(
      ([fields, filters, groups]) =>
        RelationalDashboardQuery.create({
          advancedFields: ZenArray.create(fields),
          advancedFilters: ZenArray.create(filters),
          advancedGroups: ZenArray.create(groups),
          dateRange: dateRangeId,
          groupBy,
          id,
          filters: ZenArray.create(magicFilters),
          name,

          frontendSelectionsFilter,
          filterModalSelections,
          isAdvancedQueryItem,
          settingId,
          type,
          itemId,
          customFields: ZenArray.create(customFieldModels),
        }),
    );
  }

  @override
  serialize(): SerializedDashboardQuery {
    const {
      advancedFields,
      advancedFilters,
      advancedGroups,
      dateRange,
      groupBy,
      id,
      filters,
      name,

      customFields,
      frontendSelectionsFilter,
      filterModalSelections,
      isAdvancedQueryItem,
      settingId,
      type,
      itemId,
    } = this.modelValues();

    const output = {
      advancedFields: advancedFields.mapValues(field => field.serialize()),
      advancedFilters: advancedFilters.mapValues(QueryFilterItemUtil.serialize),
      advancedGroups: advancedGroups.mapValues(GroupingItemUtil.serialize),
      dateRangeId: dateRange,
      groupBy,
      id,
      magicFilters: filters.serialize(),
      name,
      customFields: customFields.mapValues(field => field.serialize()),
      frontendSelectionsFilter,
      filterModalSelections,
      isAdvancedQueryItem,
      settingId,
      type,
      itemId,
    };

    return output;
  }
}
