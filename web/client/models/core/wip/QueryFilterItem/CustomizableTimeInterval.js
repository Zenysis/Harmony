// @flow
import Promise from 'bluebird';
import invariant from 'invariant';
import moment from 'moment';

import * as Zen from 'lib/Zen';
import CalendarSettings from 'models/config/CalendarSettings';
import DatePickerSettings from 'models/config/CalendarSettings/DatePickerSettings';
import IntervalFilter from 'models/core/wip/QueryFilter/IntervalFilter';
import Moment from 'models/core/wip/DateTime/Moment';
import NotFilter from 'models/core/wip/QueryFilter/NotFilter';
import TimeInterval from 'models/core/wip/DateTime/TimeInterval';
import computeDateRange from 'components/ui/DatePicker/computeDateRange';
import memoizeOne from 'decorators/memoizeOne';
import {
  RELATIVE_DATE_TYPE,
  computeRelativeDate,
  relativeDateTypeToDateConfiguration,
} from 'models/core/wip/QueryFilterItem/util';
import { getDateDisplayName } from 'selection_util';
import { getEthiopianDateLabel } from 'util/dateUtil';
import { uniqueId } from 'util/util';
import type {
  AllTimeConfig,
  YearToDateConfig,
  CalendarType,
  DateConfiguration,
  LastDateConfig,
  ThisDateConfig,
} from 'components/ui/DatePicker/types';
import type { Customizable } from 'types/interfaces/Customizable';
import type { DateType } from 'models/core/wip/QueryFilterItem/util';
import type { Displayable } from 'types/interfaces/Displayable';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';
import type { QueryFilter } from 'models/core/wip/QueryFilter/types';
import type { Serializable } from 'lib/Zen';

const NAME = t('query_form.select_relative_date.label');
const MIN_DATA_DATE: moment$Moment = moment(
  window.__JSON_FROM_BACKEND.ui.minDataDate,
);
const MAX_DATA_DATE: moment$Moment = moment(
  window.__JSON_FROM_BACKEND.ui.maxDataDate,
);

type RequiredValues = {
  id: string,

  // TODO(pablo): this should be derivable from `dateConfiguration`. Once the
  // old date picker is killed, we can move this to a Derived value.
  filter: IntervalFilter,
  dateConfiguration: DateConfiguration,
};

type DefaultValues = {
  // TODO(pablo): stop supporting this type when the old date picker is killed.
  // Remember to include a Dashboard Spec upgrade when you do this! Otherwise
  // old dashboards that don't use a DateConfiguration object will break.
  +dateType: DateType,
  +invert: boolean,
};

type SerializedDateConfiguration =
  | ThisDateConfig
  | LastDateConfig
  | YearToDateConfig
  | AllTimeConfig
  | {
      +modifier: 'BETWEEN',
      +calendarType?: CalendarType,
      +range: {
        +from: string, // date in YYYY-MM-DD format
        +to: string, // date in YYYY-MM-DD format
      },
    }
  | {
      +modifier: 'SINCE',
      +calendarType?: CalendarType,
      +date: string, // date in YYYY-MM-DD format
    };

type SerializedCustomizableTimeInterval = {
  id: string,

  // TODO(pablo): once the old date picker is killed, we can remove `void` from
  // this type, because it means all time intervals should be using our new
  // DateConfiguration type
  dateConfiguration: SerializedDateConfiguration | void,

  // TODO(pablo): dateType should no longer be serialized once the old date picker
  // is killed
  dateType: DateType,

  // TODO(pablo): this should not be serialized, it is derivable from the
  // dateConfiguration. This should be changed once the old date picker is
  // entirely killed off.
  filter: Zen.Serialized<IntervalFilter>,
  invert: boolean | void,
};

const SERIALIZED_DATE_FORMAT = 'YYYY-MM-DD';

function deserializeDateConfiguration(
  serializedDateConfiguration: SerializedDateConfiguration,
): DateConfiguration {
  if (serializedDateConfiguration.modifier === 'BETWEEN') {
    const { range, calendarType } = serializedDateConfiguration;
    const { from, to } = range;
    return {
      modifier: 'BETWEEN',
      calendarType:
        calendarType || DatePickerSettings.current().defaultCalendarType(),
      range: {
        from: moment(from),
        to: moment(to),
      },
    };
  }

  if (serializedDateConfiguration.modifier === 'SINCE') {
    const { date, calendarType } = serializedDateConfiguration;
    return {
      modifier: 'SINCE',
      calendarType:
        calendarType || DatePickerSettings.current().defaultCalendarType(),
      date: moment(date),
    };
  }

  if (serializedDateConfiguration.modifier === 'ALL_TIME') {
    const { calendarType, displayName } = serializedDateConfiguration;
    return {
      displayName,
      modifier: 'ALL_TIME',
      calendarType:
        calendarType || DatePickerSettings.current().defaultCalendarType(),
    };
  }

  return serializedDateConfiguration;
}

function serializeDateConfiguration(
  dateConfiguration: DateConfiguration,
): SerializedDateConfiguration {
  if (dateConfiguration.modifier === 'BETWEEN') {
    const { range, calendarType } = dateConfiguration;
    const { from, to } = range;
    invariant(
      from && to,
      'Can only serialize a date configuration that has all valid dates.',
    );
    return {
      calendarType,
      modifier: 'BETWEEN',
      range: {
        from: Moment.create(from).format(SERIALIZED_DATE_FORMAT),
        to: Moment.create(to).format(SERIALIZED_DATE_FORMAT),
      },
    };
  }

  if (dateConfiguration.modifier === 'SINCE') {
    const { date, calendarType } = dateConfiguration;
    invariant(
      date,
      'Can only serialize a date configuration that has all valid dates.',
    );
    return {
      calendarType,
      modifier: 'SINCE',
      date: Moment.create(date).format(SERIALIZED_DATE_FORMAT),
    };
  }

  return dateConfiguration;
}

/**
 * The CustomizableTimeInterval model provides a container for a time interval
 * filter and a way to display that interval cleanly to the user.
 */
class CustomizableTimeInterval
  extends Zen.BaseModel<CustomizableTimeInterval, RequiredValues, DefaultValues>
  implements
    Serializable<SerializedCustomizableTimeInterval>,
    Customizable<CustomizableTimeInterval>,
    NamedItem,
    Displayable {
  tag: 'CUSTOMIZABLE_TIME_INTERVAL' = 'CUSTOMIZABLE_TIME_INTERVAL';

  static defaultValues: DefaultValues = {
    dateType: 'CUSTOM',
    invert: false,
  };

  static createDefaultInterval(): Zen.Model<CustomizableTimeInterval> {
    return CustomizableTimeInterval.create({
      id: 'interval_1',
      dateType: 'CUSTOM',
      dateConfiguration: {
        modifier: 'THIS',
        dateUnit: 'YEAR',
      },
      filter: IntervalFilter.create({
        interval: TimeInterval.create({
          start: Moment.create().startOf('year'),
          // our druid queries are non-inclusive with the end date. So to make
          // the end date be today, we must add 1 day
          end: Moment.create()
            .endOf('year')
            .add(1, 'd'),
        }),
      }),
    });
  }

  static createIntervalFromDates(
    startDate: Moment,
    endDate: Moment,
    dateType?: 'CUSTOM' | 'ET_CHOOSE_MONTHS' = 'CUSTOM',
  ): Zen.Model<CustomizableTimeInterval> {
    return CustomizableTimeInterval.create({
      dateType,
      id: `interval_${startDate.format()}_${endDate.format()}`,
      dateConfiguration: {
        modifier: 'BETWEEN',
        calendarType: DatePickerSettings.current().defaultCalendarType(),
        range: {
          from: startDate.momentView(),
          to: endDate.subtract(1, 'day').momentView(),
        },
      },
      filter: IntervalFilter.create({
        interval: TimeInterval.create({
          start: startDate,
          end: endDate,
        }),
      }),
    });
  }

  static createLastNDaysInterval(
    numDays: number,
    endDate: Moment,
  ): Zen.Model<CustomizableTimeInterval> {
    const startDate = endDate.subtract(numDays, 'd');
    return CustomizableTimeInterval.create({
      id: `interval_last_${numDays}_days_1`,
      dateType: 'CUSTOM',
      dateConfiguration: {
        modifier: 'BETWEEN',
        calendarType: DatePickerSettings.current().defaultCalendarType(),
        range: {
          from: startDate.momentView(),
          to: endDate.subtract(1, 'day').momentView(),
        },
      },
      filter: IntervalFilter.create({
        interval: TimeInterval.fromDateStrings(
          startDate.format(),
          endDate.format(),
        ),
      }),
    });
  }

  static deserializeAsync(
    values: SerializedCustomizableTimeInterval,
  ): Promise<Zen.Model<CustomizableTimeInterval>> {
    const { id, dateType, dateConfiguration, filter, invert } = values;

    // TODO(stephen): Move relative date computation into a lib that is much
    // more flexible than the current implementation.
    // TODO(pablo): once old date picker is killed this will all be much
    // simpler, because we only need to store a `dateConfiguration`. The
    // IntervalFilter can then just be a derived value from the date
    // configuration.
    // $FlowExpectedError[prop-missing] - if CUSTOM is missing then it'll be undefined
    if (RELATIVE_DATE_TYPE[dateType] !== undefined) {
      const { startDate, endDate } = computeRelativeDate((dateType: any));
      const newDateConfiguration =
        dateConfiguration === undefined
          ? relativeDateTypeToDateConfiguration(dateType)
          : deserializeDateConfiguration(dateConfiguration);

      // calling updateDateConfiguration here just to ensure that the correct
      // relative dates are recalculated.
      // TODO (pablo): this will be unnecessary once `filter` is moved to be
      // a derived value from the dateConfiguration
      return Promise.resolve(
        CustomizableTimeInterval.create({
          id,
          dateType,
          invert,
          dateConfiguration: newDateConfiguration,
          filter: IntervalFilter.UNSAFE_deserialize({
            end: endDate,
            start: startDate,
            type: 'INTERVAL',
          }),
        }).updateDateConfiguration(newDateConfiguration),
      );
    }

    return IntervalFilter.deserializeAsync(filter).then(intervalFilter => {
      const newDateConfiguration =
        dateConfiguration === undefined
          ? {
              modifier: 'BETWEEN',
              calendarType: DatePickerSettings.current().defaultCalendarType(),
              range: {
                from: intervalFilter
                  .interval()
                  .start()
                  .momentView(),
                to: intervalFilter
                  .interval()
                  .end()
                  .subtract(1, 'day')
                  .momentView(),
              },
            }
          : deserializeDateConfiguration(dateConfiguration);

      // calling updateDateConfiguration here just to ensure that the correct
      // relative dates are recalculated.
      // TODO (pablo): this will be unnecessary once `filter` is moved to be
      // a derived value from the dateConfiguration
      return CustomizableTimeInterval.create({
        id,
        dateType,
        invert,
        dateConfiguration: newDateConfiguration,
        filter: intervalFilter,
      }).updateDateConfiguration(newDateConfiguration);
    });
  }

  static UNSAFE_deserialize(
    values: SerializedCustomizableTimeInterval,
  ): Zen.Model<CustomizableTimeInterval> {
    const { id, dateType, dateConfiguration, filter } = values;
    let serializedIntervalFilter = filter;
    let newDateConfiguration =
      dateConfiguration === undefined
        ? {
            modifier: 'BETWEEN',
            calendarType: DatePickerSettings.current().defaultCalendarType(),
            range: {
              from: moment(filter.start),
              to: moment(filter.end).subtract(1, 'day'),
            },
          }
        : deserializeDateConfiguration(dateConfiguration);

    // $FlowExpectedError[prop-missing] - if CUSTOM is missing then it'll be undefined
    if (RELATIVE_DATE_TYPE[dateType] !== undefined) {
      const { startDate, endDate } = computeRelativeDate((dateType: any));
      serializedIntervalFilter = {
        end: endDate,
        start: startDate,
        type: 'INTERVAL',
      };

      if (dateConfiguration === undefined) {
        // only derive the date configuration from the legacy relative date if
        // we didn't already receive a serialized date configuration in `values`
        newDateConfiguration = relativeDateTypeToDateConfiguration(dateType);
      }
    }

    // calling updateDateConfiguration here just to ensure that the correct
    // relative dates are recalculated.
    // TODO (pablo): this will be unnecessary once `filter` is moved to be
    // a derived value from the dateConfiguration
    return CustomizableTimeInterval.create({
      id,
      dateType,
      dateConfiguration: newDateConfiguration,
      filter: IntervalFilter.UNSAFE_deserialize(serializedIntervalFilter),
    }).updateDateConfiguration(newDateConfiguration);
  }

  customize(): Zen.Model<CustomizableTimeInterval> {
    return this._.id(`${this._.id()}__${uniqueId()}`);
  }

  // TODO(pablo): once the old date picker is killed this function should no
  // longer exist, because the internal time interval will be derived
  // automatically whenever the date configuration changes
  /**
   * Use this function to update a date configuration, so that the time
   * interval also updates accordingly.
   */
  updateDateConfiguration(
    dateConfiguration: DateConfiguration,
  ): Zen.Model<CustomizableTimeInterval> {
    const { from, to } = computeDateRange(dateConfiguration, {
      fiscalStartMonth: CalendarSettings.current().fiscalStartMonth(),
      minAllTimeDate: MIN_DATA_DATE,
      maxAllTimeDate: MAX_DATA_DATE,
    });
    return this._.dateConfiguration(dateConfiguration).filter(
      IntervalFilter.create({
        interval: TimeInterval.create({
          start: Moment.create(from),

          // our druid queries are not inclusive on the end date, so we have
          // to add 1 to the date range returned by DatePicker's
          // DateConfiguration to ensure we include the last day
          end: Moment.create(to).add(1, 'day'),
        }),
      }),
    );
  }

  @memoizeOne
  displayValue(): string {
    // Prefer the human-readable name attached to this interval. Custom date
    // ranges should have the full date range returned.
    const interval = this._.filter().interval();
    const start = interval.start();

    // NOTE(stephen): Since we store the `exclusive` end date in the interval,
    // we need to display the last date that is included in the interval so the
    // user is not confused.
    const end = interval.end().subtract(1, 'day');
    const dateType = this._.dateType();

    // Use Ethiopian date labels if the chosen date range was specified using
    // the Ethiopian calendar.
    if (dateType === 'ET_CHOOSE_MONTHS') {
      const ethiopianStart = getEthiopianDateLabel(start, false, true);
      const ethiopianEnd = getEthiopianDateLabel(end, false, true);
      return `${ethiopianStart} - ${ethiopianEnd}`;
    }

    if (this._.dateConfiguration() || dateType === 'CUSTOM') {
      return `${start.format('ll')} - ${end.format('ll')}`;
    }

    return getDateDisplayName(dateType);
  }

  // This function is necessary to use this model in a HierarchicalSelector,
  // so that we can give its hierarchy item a label
  name(): string {
    return NAME;
  }

  /**
   * Return the fully built filter, which wraps in a NotFilter if `invert` is
   * set
   */
  @memoizeOne
  getFullyBuiltFilter(): QueryFilter | void {
    const filter = this._.filter();
    if (this._.invert()) {
      return NotFilter.create({ field: filter });
    }
    return filter;
  }

  serialize(): SerializedCustomizableTimeInterval {
    return {
      id: this._.id(),
      dateType: this._.dateType(),
      dateConfiguration: serializeDateConfiguration(this._.dateConfiguration()),
      filter: this._.filter().serialize(),
      invert: this._.invert(),
    };
  }
}

export default ((CustomizableTimeInterval: $Cast): Class<
  Zen.Model<CustomizableTimeInterval>,
>);
