// @flow
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import DatePickerSettings from 'models/config/CalendarSettings/DatePickerSettings';
import DimensionService from 'services/wip/DimensionService';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import GranularityService from 'services/wip/GranularityService';
import GroupingDimension from 'models/core/wip/GroupingItem/GroupingDimension';
import GroupingGranularity from 'models/core/wip/GroupingItem/GroupingGranularity';
import Moment from 'models/core/wip/DateTime/Moment';
import QuerySelections from 'models/core/wip/QuerySelections';
import { dateToEthiopianDateString } from 'components/ui/DatePicker/internal/ethiopianDateUtil';
// TODO(david): Move this out of DataQualityApp to some kind of
// DimensionValueFilter utility
import { deserializeAlertChecks } from 'models/AlertsApp/AlertCheck';
import { getDimensionValueFromDimenisonValueNames } from 'components/DataQualityApp/util';
import {
  getReadableDimensionString,
  TIME_GRANULARITY_MAP,
} from 'models/AlertsApp/AlertDefinition';
import type AlertDefinition from 'models/AlertsApp/AlertDefinition';
import type {
  AlertCheck,
  SerializedAlertCheck,
} from 'models/AlertsApp/AlertCheck';
import type { Deserializable } from 'lib/Zen';
import type { JSONRef } from 'services/types/api';

const ALERT_BOUNDARY_DATE_FORMAT = 'YYYY-MM-DD';
const ALERT_BOUNDARY_READABLE_FORMAT = 'MMM D, YYYY';

function getIdFromUri(uri: string): string {
  return uri.split('/').slice(-1)[0];
}

type SerializedDimensionInfo = {
  dimension_name: string,
  dimension_val: string,
};

type RequiredValues = {
  /** The uri of the Alert Definition for this notification */
  alertDefinitionUri: string,

  /** Compared value for this notification if it is a comparative alert. */
  comparedValue: string | void,

  /** Dimension id for notification. */
  dimensionId: string,

  /** Dimension values related to this notification. */
  dimensionInfo: { [dimensionId: string]: string, ... },

  /** Human readable field names. */
  fieldNames: Zen.Array<string>,

  /** Object containing notification checks. */
  checks: Zen.Array<AlertCheck>,

  /** Unique ID for this notification. This is being deprecated. */
  id: string,

  /** Date when this notification was generated. */
  generationDate: string,

  /** The end date of the query used for this alert. This is exclusive. */
  queryEndDate: Moment,

  /** The start date of the query used for this alert. This is inclusive. */
  queryStartDate: Moment,

  /** Reported value for this notification. */
  reportedValue: string,

  /** Time Frequency for this notification */
  timeFrequency: string,

  /** The title of the associated alert definition. */
  title: string,

  /** URI for this notification. */
  uri: string,
};

type DerivedValues = {
  /** Dimension level for notification. */
  dimensionDisplayName: string,

  /** Triggered dimension value for this notification. */
  dimensionValue: string,
};

type SerializedAlertNotification = {
  alertDefinition: JSONRef,
  checks: $ReadOnlyArray<SerializedAlertCheck>,
  comparedVal: string | null,
  dimensionName: string,
  dimensionInfo: { [dimensionId: string]: SerializedDimensionInfo },
  fieldNames: $ReadOnlyArray<string>,
  generationDate: string,

  /**
   * queryInterval comes from the backend in the string format
   * 'YYYY-MM-DD/YYYY-MM-DD' where the first date is the start date,
   * followed by the end date. The dates are inclusive/exclusive.
   */
  queryInterval: string,
  reportedVal: string,
  timeGranularity: string,
  title: string,
  $uri: string,
};

// TODO(toshi, anyone): Deprecate the `id` field, it should be replaced with
// alertDefinitionUri. Currently it is included to support the case management
// tool which will get refactored.
/*
 * AlertNotification represents a single instance at which an alert has been
 * triggered. This is in contrast to an AlertDefinition, which defines the
 * parameters which, when met, trigger the generation of an AlertNotification.
 */
class AlertNotification
  extends Zen.BaseModel<AlertNotification, RequiredValues, {}, DerivedValues>
  implements Deserializable<SerializedAlertNotification> {
  static derivedConfig: Zen.DerivedConfig<AlertNotification, DerivedValues> = {
    dimensionDisplayName: [
      Zen.hasChanged('dimensionId'),
      alertNotification =>
        getReadableDimensionString(alertNotification.dimensionId()),
    ],
    dimensionValue: [
      Zen.hasChanged('dimensionId', 'dimensionInfo'),
      alertNotification =>
        alertNotification.dimensionInfo()[alertNotification.dimensionId()],
    ],
  };

  static deserializeDimensionInfo(dimensionInfo: {
    [dimensionId: string]: SerializedDimensionInfo,
  }): { [string]: string } {
    const convertedMap = {};
    Object.keys(dimensionInfo).forEach(key => {
      convertedMap[key] = dimensionInfo[key].dimension_val;
    });
    return convertedMap;
  }

  static deserialize({
    alertDefinition,
    comparedVal,
    checks,
    dimensionName,
    dimensionInfo,
    fieldNames,
    generationDate,
    queryInterval,
    reportedVal,
    timeGranularity,
    title,
    $uri,
  }: SerializedAlertNotification): Zen.Model<AlertNotification> {
    const [startDateStr, endDateStr] = queryInterval.split('/');
    return AlertNotification.create({
      generationDate,
      title,
      alertDefinitionUri: alertDefinition.$ref,
      comparedValue: comparedVal === null ? undefined : comparedVal,
      checks: deserializeAlertChecks(checks),
      dimensionId: dimensionName,
      dimensionInfo: this.deserializeDimensionInfo(dimensionInfo),
      fieldNames: Zen.Array.create(fieldNames),
      id: getIdFromUri($uri),
      reportedValue: reportedVal,
      queryStartDate: Moment.create(startDateStr, ALERT_BOUNDARY_DATE_FORMAT),
      queryEndDate: Moment.create(endDateStr, ALERT_BOUNDARY_DATE_FORMAT),
      timeFrequency: timeGranularity,
      uri: $uri,
    });
  }

  // check if the alert's date period is a single date
  isSingleDatePeriod(): boolean {
    const { queryEndDate, queryStartDate } = this._.modelValues();
    return queryEndDate.diff(queryStartDate, 'days') === 1;
  }

  /**
   * String representing the dates queried to produce this notification in a human-readable
   * format. This is inclusive/inclusive. If the interval is for a single day, then just the
   * date will be returned. The default format is MMM D, YYYY - MMM D, YYYY (or MMM D, YYYY for
   * a single day). This can be customized by passing in a date format and/ or a string to
   * connect the two dates (ie. 'to'). Note that if the default calendar type is Ethiopian, then
   * date format cannot currently be changed.
   */
  getReadableQueryInterval(
    dateFormat: string = ALERT_BOUNDARY_READABLE_FORMAT,
    dateSeparator: string = '-',
  ): string {
    const queryStartDate = this._.queryStartDate();
    // NOTE(abby): The end date is stored exclusive because that's what druid uses, but for
    // the human readable format, display it inclusive.
    const queryEndDate = this._.queryEndDate().subtract(1, 'day');

    // Get the dates in the right display format
    const dateSettings = DatePickerSettings.current();
    let startStr = queryStartDate.format(dateFormat);
    let endStr = queryEndDate.format(dateFormat);

    if (dateSettings.defaultCalendarType() === 'ETHIOPIAN') {
      startStr = dateToEthiopianDateString(queryStartDate.momentView());
      endStr = dateToEthiopianDateString(queryEndDate.momentView());
    }

    // Format the interval string
    if (this.isSingleDatePeriod()) {
      return startStr;
    }

    return `${startStr} ${dateSeparator} ${endStr}`;
  }

  isThreshold(): boolean {
    return this._.comparedValue() === undefined;
  }

  /**
   * Build a query reflecting this alert notification. From the notification's associated alert
   * definition, it takes the fields, dimension, and time granularity. From the notification,
   * it takes the dimension value and query time interval this notification was triggered for.
   *
   * The optional parameters are for case management. In case management, the generated query
   * may use another time granularity (overrideTimeGranularity) and is not filtered to this
   * notification's query interval.
   */
  buildQuerySelections(
    alertDefinition: AlertDefinition,
    overrideTimeGranularity: string | void = undefined,
    useTimeFilter: boolean = true,
  ): Promise<QuerySelections> {
    invariant(
      this._.alertDefinitionUri() === alertDefinition.uri(),
      'Alert definition passed in does not match this alert notification',
    );

    const {
      dimensionInfo,
      queryEndDate,
      queryStartDate,
    } = this._.modelValues();
    const { dimensionId, fields } = alertDefinition.modelValues();

    // NOTE(abby): For alert cases in case management, may need to override the alert definition
    // time granularity.
    const timeGranularity =
      overrideTimeGranularity || alertDefinition.timeGranularity();

    return Promise.all([
      DimensionService.get(dimensionId),
      GranularityService.get(timeGranularity),
      getDimensionValueFromDimenisonValueNames(dimensionInfo, dimensionId),
    ]).then(([dimension, granularity, dimensionValue]) => {
      invariant(
        dimension !== undefined,
        `Alert Notification Dimension must not be undefined. Could not retrieve Dimension object for id ${dimensionId}`,
      );
      invariant(
        granularity !== undefined,
        `Alert Notification Time Granularity must not be undefined. Could not retrieve Granularity object for id ${timeGranularity}`,
      );
      invariant(
        dimensionValue !== undefined,
        `Alert Notification Dimension Value must not be undefined. Could not retrieve Dimension Value object from dimension id ${dimensionId} and values ${JSON.stringify(
          dimensionInfo,
        )}`,
      );

      const dimensionValueFilterItem = DimensionValueFilterItem.createFromDimensionValues(
        dimensionValue,
      );

      const timeFilter = CustomizableTimeInterval.createIntervalFromDates(
        queryStartDate,
        queryEndDate,
      );
      // NOTE(abby): For alert cases in case management, a query over all time is produced and
      // there should not be a filter on the query interval.
      const filters = useTimeFilter
        ? [dimensionValueFilterItem, timeFilter]
        : [dimensionValueFilterItem];

      const groupingDimension = GroupingDimension.create({
        dimension: dimension.id(),
        name: dimension.name(),
      });
      const groupingGranularity = GroupingGranularity.createFromGranularity(
        granularity,
      );

      return QuerySelections.create({
        fields: Zen.Array.create(fields),
        filter: Zen.Array.create(filters),
        groups: Zen.Array.create([groupingDimension, groupingGranularity]),
      });
    });
  }

  getReadableFrequency(): string {
    return TIME_GRANULARITY_MAP[this._.timeFrequency()];
  }

  getNotificationMessage(): string {
    const check = this._.checks().first();
    const reportedVal = this._.reportedValue();
    switch (check.tag) {
      case 'THRESHOLD':
        return `${reportedVal}  (${check.operation()} ${check.threshold()})`;
      case 'COMPARATIVE': {
        const comparedFieldName = this._.fieldNames().get(1);
        return `${reportedVal}  (${check.operation()} ${comparedFieldName})`;
      }
      default:
        (check.tag: empty);
        return '';
    }
  }

  getCondition(): string {
    const check = this._.checks().first();
    switch (check.tag) {
      case 'THRESHOLD':
        return `${check.operation()} ${check.threshold()}`;
      case 'COMPARATIVE': {
        const comparedFieldName = this._.fieldNames().get(1);
        return `${check.operation()} ${comparedFieldName}`;
      }
      default:
        (check.tag: empty);
        return '';
    }
  }
}

export default ((AlertNotification: $Cast): Class<
  Zen.Model<AlertNotification>,
>);
