// @flow
import PropTypes from 'prop-types';

import ZenArray from 'util/ZenModel/ZenArray';
import ZenModel, { def } from 'util/ZenModel';
import { override } from 'decorators';

export type SerializedDashboardFilter = {
  id: string,
  filterOn: string,
  filterValues: Array<string>,
  name: string,
};

/**
 * DashboardFilter represents a query filter for a given
 * `RelationalDashboardQuery` or any of its derivative types. By specifying
 * `filterOn` and `filterValues`, the values that a query returns can be
 * filtered by specific fields and specific field values.
 */
export default class DashboardFilter extends ZenModel.withTypes({
  /**
   * @readonly
   * The string representation of the unique id that corresponds to this
   * individual filter instance.
   */
  id: def(PropTypes.string.isRequired, undefined, ZenModel.PRIVATE),

  /**
   * The backend dimension that this filter will filter for values against.
   * (e.g. 'field')
   */
  filterOn: def(PropTypes.string.isRequired, undefined),

  /**
   * The individual values encapsulated within a particular dimension that
   * query results should be restricted to.
   * (e.g. ['hmis_indicator_47', 'hmis_indicator_48'])
   */
  filterValues: def(
    ZenArray.of(PropTypes.string).isRequired,
    ZenArray.create(),
  ),

  /**
   * An (optional) human-readable name that can be used to describe what effect
   * this filter has on the underlying queried data.
   */
  name: def(PropTypes.string, undefined),
}) {
  @override
  static deserialize(values: SerializedDashboardFilter): DashboardFilter {
    const { id, filterOn, filterValues, name } = values;

    return DashboardFilter.create({
      id,
      filterOn,
      filterValues: ZenArray.create(filterValues),
      name,
    });
  }
}
