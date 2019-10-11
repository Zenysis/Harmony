// @flow
import PropTypes from 'prop-types';

// TODO(stephen): Move this relative date computation into a utility.
import {
  RELATIVE_DATE_TYPE,
  computeRelativeDate,
} from 'components/QueryApp/QueryForm/SelectRelativeDate';
import Moment from 'models/core/wip/DateTime/Moment';
import ZenModel, { def } from 'util/ZenModel';
import { override } from 'decorators';
import type { DateType } from 'components/QueryApp/QueryForm/SelectDatesContainer';
import type { RelativeDateType } from 'components/QueryApp/QueryForm/SelectRelativeDate';

const DATE_FORMAT = 'YYYY-MM-DDThh:mm:ss';

export const SELECTIONS_DATE_FORMAT = 'YYYY-MM-DD';

const DATE_TYPES: $ReadOnlyArray<DateType> = Object.keys(
  RELATIVE_DATE_TYPE,
).concat(['CUSTOM', 'ET_CHOOSE_MONTHS']);

export type SerializedDashboardDateRange = {
  dateType: DateType,
  endDate: string,
  id: string,
  startDate: string,
};

/**
 * DashboardDateRange represents a date range for a given
 * `RelationalDashboardQuery` or any of its derivative types. The range
 * `startDate` and `endDate` specified control how query results are filtered
 * by their date.
 */
export default class DashboardDateRange extends ZenModel.withTypes({
  /**
   * The type of date range that this individual instance represents.
   */
  dateType: def(PropTypes.oneOf(DATE_TYPES).isRequired),

  /**
   * The end date of the query.
   */
  endDate: def(PropTypes.instanceOf(Moment).isRequired),

  /**
   * @readonly
   * The string representation of the unique id that corresponds to this
   * individual date range instance.
   */
  id: def(PropTypes.string.isRequired, undefined, ZenModel.PRIVATE),

  /**
   * The start date of the query.
   */
  startDate: def(PropTypes.instanceOf(Moment).isRequired),
}) {
  @override
  static deserialize(values: SerializedDashboardDateRange): DashboardDateRange {
    const { dateType, id } = values;
    let { startDate, endDate } = values;
    // TODO(stephen): Move relative date computation into a lib that is much
    // more flexible than the current implementation.
    // $FlowIndexerIssue
    if (RELATIVE_DATE_TYPE[dateType] !== undefined) {
      ({ startDate, endDate } = computeRelativeDate((dateType: any)));
    }
    return DashboardDateRange.create({
      id,
      dateType,
      startDate: Moment.create(startDate, DATE_FORMAT),
      endDate: Moment.create(endDate, DATE_FORMAT),
    });
  }

  @override
  serialize(): SerializedDashboardDateRange {
    const {
      dateType,
      id,
      endDate,
      startDate,
    } = this.modelValues();

    const output: SerializedDashboardDateRange = {
      dateType,
      id,
      endDate: endDate.format(DATE_FORMAT),
      startDate: startDate.format(DATE_FORMAT),
    };

    return output;
  }
}
