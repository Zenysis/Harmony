// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import IntervalFilter from 'models/core/wip/QueryFilter/IntervalFilter';
import Moment from 'models/core/wip/DateTime/Moment';
import TimeInterval from 'models/core/wip/DateTime/TimeInterval';
import memoizeOne from 'decorators/memoizeOne';
import {
  // TODO(stephen): Move this relative date computation into a utility.
  RELATIVE_DATE_TYPE,
  computeRelativeDate,
} from 'components/QueryApp/QueryForm/SelectRelativeDate';
import { getDateDisplayName } from 'selection_util';
import { getEthiopianDateLabel } from 'util/dateUtil';
import { uniqueId } from 'util/util';
import type { Customizable } from 'types/interfaces/Customizable';
import type { DateType } from 'components/QueryApp/QueryForm/SelectDatesContainer';
import type { Displayable } from 'types/interfaces/Displayable';
import type { RelativeDateType } from 'components/QueryApp/QueryForm/SelectRelativeDate';
import type { Serializable } from 'lib/Zen';

const NAME = t('query_form.select_relative_date.label');

type RequiredValues = {
  id: string,
  filter: IntervalFilter,
};

type DefaultValues = {
  dateType: DateType,
};

type SerializedCustomizableTimeInterval = {
  id: string,
  dateType: DateType,
  filter: Zen.Serialized<IntervalFilter>,
};

/**
 * The CustomizableTimeInterval model provides a container for a time interval
 * filter and a way to display that interval cleanly to the user.
 */
class CustomizableTimeInterval
  extends Zen.BaseModel<CustomizableTimeInterval, RequiredValues, DefaultValues>
  implements
    Serializable<SerializedCustomizableTimeInterval>,
    Customizable<CustomizableTimeInterval>,
    Displayable {
  static defaultValues = {
    dateType: 'CUSTOM',
  };

  static createDefaultInterval(): Zen.Model<CustomizableTimeInterval> {
    return CustomizableTimeInterval.create({
      id: 'interval_1',
      dateType: 'CUSTOM',
      filter: IntervalFilter.create({
        interval: TimeInterval.create({
          start: Moment.create().subtract(1, 'y'),

          // our druid queries are non-inclusive with the end date. So to make
          // the end date be today, we must add 1 day
          end: Moment.create().add(1, 'd'),
        }),
      }),
    });
  }

  static createIntervalFromDates(
    startDate: Moment,
    endDate: Moment,
  ): Zen.Model<CustomizableTimeInterval> {
    const start = startDate.format();
    const end = endDate.format();
    return CustomizableTimeInterval.create({
      id: `interval_${start}_${end}`,
      dateType: 'CUSTOM',
      filter: IntervalFilter.create({
        interval: TimeInterval.fromDateStrings(start, end),
      }),
    });
  }

  static createLastNDaysInterval(
    numDays: number,
    endDate: Moment,
  ): Zen.Model<CustomizableTimeInterval> {
    const end = endDate.format();
    const startDate = endDate.subtract(numDays, 'd').format();
    return CustomizableTimeInterval.create({
      id: `interval_last_${numDays}_days_1`,
      dateType: 'CUSTOM',
      filter: IntervalFilter.create({
        interval: TimeInterval.fromDateStrings(startDate, end),
      }),
    });
  }

  static fromRelativeDate(
    relativeDateType: RelativeDateType,
  ): Zen.Model<CustomizableTimeInterval> {
    const { startDate, endDate } = computeRelativeDate(relativeDateType);
    return CustomizableTimeInterval.create({
      id: 'interval_relative_1',
      dateType: relativeDateType,
      filter: IntervalFilter.create({
        interval: TimeInterval.fromDateStrings(startDate, endDate),
      }),
    });
  }

  static deserializeAsync(
    values: SerializedCustomizableTimeInterval,
  ): Promise<Zen.Model<CustomizableTimeInterval>> {
    const { id, dateType, filter } = values;

    // TODO(stephen): Move relative date computation into a lib that is much
    // more flexible than the current implementation.
    // $FlowIndexerIssue
    if (RELATIVE_DATE_TYPE[dateType] !== undefined) {
      const { startDate, endDate } = computeRelativeDate((dateType: any));
      return Promise.resolve(
        CustomizableTimeInterval.create({
          id,
          dateType,
          filter: IntervalFilter.UNSAFE_deserialize({
            end: endDate,
            start: startDate,
            type: 'INTERVAL',
          }),
        }),
      );
    }

    return IntervalFilter.deserializeAsync(filter).then(intervalFilter =>
      CustomizableTimeInterval.create({
        id,
        dateType,
        filter: intervalFilter,
      }),
    );
  }

  customize(): Zen.Model<CustomizableTimeInterval> {
    return this._.id(`${this._.id()}__${uniqueId()}`);
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

    if (dateType === 'CUSTOM') {
      return `${start.format('ll')} - ${end.format('ll')}`;
    }

    return getDateDisplayName(dateType);
  }

  // This function is necessary to use this model in a HierarchicalSelector,
  // so that we can give its hierarchy item a label
  name(): string {
    return NAME;
  }

  serialize(): SerializedCustomizableTimeInterval {
    return {
      id: this._.id(),
      dateType: this._.dateType(),
      filter: this._.filter().serialize(),
    };
  }
}

export default ((CustomizableTimeInterval: any): Class<
  Zen.Model<CustomizableTimeInterval>,
>);
