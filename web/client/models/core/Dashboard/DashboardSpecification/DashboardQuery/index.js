// @flow
import PropTypes from 'prop-types';

import DashboardDateRange from 'models/core/Dashboard/DashboardSpecification/DashboardDateRange';
import DashboardFilter from 'models/core/Dashboard/DashboardSpecification/DashboardFilter';
import DashboardItemSettings from 'models/core/Dashboard/DashboardSpecification/DashboardItemSettings';
import RelationalDashboardQuery from 'models/core/Dashboard/DashboardSpecification/RelationalDashboardQuery';
import ZenArray from 'util/ZenModel/ZenArray';
import ZenModel, {
  def,
  derived,
  hasChanged,
  statefulCompute,
} from 'util/ZenModel';
import { computeLegacySelection } from 'models/core/Dashboard/DashboardSpecification/DashboardQuery/util';

/**
 * Represents an extension of the `RelationalDashboardQuery` class. Unlike its
 * relational counterpart, it contains actual models for the `dateRange`,
 * `filters` components so that components that consume this model
 * do not need to refer the specification to obtain representations of the
 * constituent models by their 'id'.
 */
export default class DashboardQuery extends RelationalDashboardQuery.withTypes({
  /**
   * @readonly
   * The filters corresponding to this particular query. All results will
   * be filtered such that they only fall match the filters defined.
   * At query time, all of the filters contained within this array will be
   * OR'ed together by the server.
   */
  filters: def(
    ZenArray.of(DashboardFilter).isRequired,
    ZenArray.create(),
    ZenModel.PRIVATE,
  ),

  /**
   * @readonly
   * The date range corresponding to this particular query. All results will
   * be filtered such that they only fall within this date range.
   * NOTE(pablo): an advanced query will not have a dateRange because this
   * is rolled into its `filters`. Eventually all queries will be formatted
   * this way.
   */
  dateRange: def(DashboardDateRange.type(), undefined, ZenModel.PRIVATE),

  /**
   * @readonly
   * The model representation of the settings object associated with this
   * dashboard item.
   * TODO(moriah): Moving setting here from DashboardItem so that
   * DashboardItem no longer holds any visualization-specific information.
   * Eventually settings should be moved elsewhere so that front end specific
   * information is not mixed into the samemodel as backend specific
   * information.
   */
  setting: def(DashboardItemSettings.type(), undefined, ZenModel.PRIVATE),
}).withDerivedValues({
  legacySelection: derived(
    PropTypes.object,
    hasChanged('frontendSelectionsFilter', 'query'),
    statefulCompute(computeLegacySelection),
  ),
}) {}
