// @flow
import invariant from 'invariant';
import moment from 'moment';

import type {
  DateConfiguration,
  LastDateConfig,
  ThisDateConfig,
} from 'components/ui/DatePicker/types';

/**
 * Generate the start/end date (in absolute dates) for the fiscal half inside
 * the fiscal calendar system of the current deployment.
 * NOTE(stephen): Half has to be calculated differently than quarter/year since
 * Moment does not have a concept of `startOf('half')` as a date transformation.
 */
function _buildRelativeFiscalHalfDates(
  fiscalStartMonth: number,
  lookbackNum?: number = 0,
  includeCurrentHalf?: boolean = false,
): [moment$Moment, moment$Moment] {
  // For every half we calculate, we need to look back 2 quarters from the
  // current date
  const numQuartersLookback = lookbackNum * 2;
  const fiscalOffset = fiscalStartMonth - 1;

  // Subtract the fiscal start month from the current date so that we can use
  // Moment's builtin quarter handling functions.
  const quarterStart = moment()
    .subtract(numQuartersLookback, 'quarter')
    .subtract(fiscalOffset, 'month')
    .startOf('quarter');

  // The fiscal half starts on quarter 1 and quarter 3. If the current quarter
  // is quarter 2 or quarter 4 then we need to subtract 1 quarter from the
  // current quarter start to get to the start of the half. We then add back
  // in the fiscalOffset so that the date returned is in the gregorian calendar
  // system and not in the fiscal calendar system.
  const halfOffset = quarterStart.quarter() % 2 === 1 ? 0 : 1;
  const startDate = quarterStart
    .clone()
    .subtract(halfOffset, 'quarter')
    .startOf('quarter')
    .add(fiscalOffset, 'month');

  const forwardOffset = includeCurrentHalf ? 2 : 0;

  const endDate = startDate
    .clone()
    .add(numQuartersLookback + forwardOffset, 'quarter');
  return [startDate, endDate];
}

/**
 * Generate the start/end date (in absolute dates) inside the fiscal calendar
 * system of the current deployment. This works for the fiscal quarter/year.
 *
 * @param {string} dateBucket The fiscal date bucket to generate a date range
 *   for.
 * @param {number} fiscalStartMonth The month of the year where the fiscal year
 *   starts. 1 = January.
 * @param {number} lookbackNum (optional) How many buckets we will look back to
 *   (e.g. look back 3 quarters).
 * @param {boolean} includeCurrentBucket (optional) Whether or not the current
 *   bucket is included (if only selecting current, this must be set to true).
 * @returns {[moment, moment]} Tuple of moment objects: [from, to]
 */
// TODO(pablo): this should no longer be exported once the old date picker is
// killed
export function buildRelativeFiscalDates(
  dateBucket: 'FISCAL_QUARTER' | 'FISCAL_HALF' | 'FISCAL_YEAR',
  fiscalStartMonth: number,
  lookbackNum?: number = 0,
  includeCurrentBucket?: boolean = false,
): [moment$Moment, moment$Moment] {
  if (dateBucket === 'FISCAL_HALF') {
    return _buildRelativeFiscalHalfDates(
      fiscalStartMonth,
      lookbackNum,
      includeCurrentBucket,
    );
  }

  const bucket = dateBucket.split('FISCAL_')[1];

  // By subtracting the fiscal start month from the date, we can still use
  // moment date functions (like startOf Quarter and startOf Year) like normal
  // to produce the correct date.
  const fiscalOffset = fiscalStartMonth - 1;
  const startDate = moment()
    .subtract(lookbackNum, bucket)
    .subtract(fiscalOffset, 'month')
    .startOf(bucket)
    .add(fiscalOffset, 'month');

  const forwardOffset = includeCurrentBucket ? 1 : 0;
  const endDate = startDate.clone().add(lookbackNum + forwardOffset, bucket);
  return [startDate, endDate];
}

function _getRangeForLastDateUnit(
  dateConfig: LastDateConfig,
  fiscalStartMonth: number,
): { from: moment$Moment, to: moment$Moment } {
  switch (dateConfig.dateUnit) {
    case 'DAY':
    case 'WEEK':
    case 'MONTH':
    case 'QUARTER':
    case 'YEAR': {
      invariant(
        dateConfig.numIntervals > 0,
        'Cannot build a LAST date range with less than 1 interval',
      );
      const { dateUnit } = dateConfig;
      return {
        from: moment()
          .subtract(dateConfig.numIntervals, dateUnit)
          .startOf(dateUnit),
        to: moment()
          .subtract(dateConfig.includeCurrentInterval ? 0 : 1, dateUnit)
          .endOf(dateUnit),
      };
    }
    case 'FISCAL_QUARTER':
    case 'FISCAL_HALF':
    case 'FISCAL_YEAR': {
      const [from, to] = buildRelativeFiscalDates(
        dateConfig.dateUnit,
        fiscalStartMonth,
        dateConfig.numIntervals,
        dateConfig.includeCurrentInterval,
      );
      return {
        from,
        // NOTE(sophie): the end date returned by the buildFiscalDates function
        // should not be inclusive, but for the new date picker the end date is
        // so we need to subtract a day
        to: to.subtract(1, 'd'),
      };
    }
    default:
      throw new Error(`Invalid date unit received: '${dateConfig.dateUnit}'`);
  }
}

function _getRangeForThisDateUnit(
  dateConfig: ThisDateConfig,
  fiscalStartMonth: number,
): { from: moment$Moment, to: moment$Moment } {
  switch (dateConfig.dateUnit) {
    case 'DAY':
    case 'WEEK':
    case 'MONTH':
    case 'QUARTER':
    case 'YEAR': {
      const { dateUnit } = dateConfig;
      return {
        from: moment().startOf(dateUnit),
        to: moment().endOf(dateUnit),
      };
    }
    case 'FISCAL_QUARTER':
    case 'FISCAL_HALF':
    case 'FISCAL_YEAR': {
      const [from, to] = buildRelativeFiscalDates(
        dateConfig.dateUnit,
        fiscalStartMonth,
        0,
        true,
      );
      return {
        from,
        // NOTE(sophie): the end date returned by the buildFiscalDates function
        // should not be inclusive, but for the new date picker the end date is
        // so we need to subtract a day
        to: to.subtract(1, 'd'),
      };
    }
    default:
      throw new Error(`Invalid date unit received: '${dateConfig.dateUnit}'`);
  }
}

type DateConstraints = {
  fiscalStartMonth?: number,
  minAllTimeDate?: moment$Moment,
  maxAllTimeDate?: moment$Moment,
};

/**
 * Convert a DateConfiguration object to a range of two Dates.
 *
 * @param {DateConfiguration} dateConfiguration The date configuration object
 * to convert to a date range.
 * @param {DateConstraints} dateConstraints (Optional) Helper options to process
 * the date configuration object according to constraints.
 *   - `fiscalStartMonth` (optional) number
 *     The month in which the fiscal year starts. Only necessary if you want to
 *     get date ranges for fiscal relative dates (e.g. FISCAL_YEAR).
 *     Defaults to 1.
 *   - `minAllTimeDate` (optional) Date
 *     If your `dateConfiguration` is ALL_TIME then this is mandatory.
 *   - `maxAllTimeDate` (optional) Date
 *     If your `dateConfiguration` is ALL_TIME then this is mandatory.
 *
 * @returns {{ from: moment$Moment, to: moment$Moment }}
 *
 */
export default function computeDateRange(
  dateConfiguration: DateConfiguration,
  dateConstraints?: DateConstraints,
): { from: moment$Moment, to: moment$Moment } {
  const { minAllTimeDate, maxAllTimeDate, fiscalStartMonth } =
    dateConstraints || {};

  switch (dateConfiguration.modifier) {
    case 'THIS':
      return _getRangeForThisDateUnit(dateConfiguration, fiscalStartMonth || 1);
    case 'LAST':
      return _getRangeForLastDateUnit(dateConfiguration, fiscalStartMonth || 1);
    case 'BETWEEN': {
      const { from, to } = dateConfiguration.range;
      invariant(
        from && to,
        'Both `from` and `to` must exist in a BETWEEN date configuration.',
      );
      return { from, to };
    }
    case 'SINCE': {
      const { date } = dateConfiguration;
      invariant(date, 'A date must exist in a SINCE date configuration.');
      return { from: date, to: moment() };
    }
    case 'ALL_TIME': {
      invariant(
        minAllTimeDate && maxAllTimeDate,
        'Both `minAllTimeDate` and `maxAllTimeDate` must be supplied to compute the ALL_TIME range',
      );
      return { from: minAllTimeDate, to: maxAllTimeDate };
    }
    case 'YEAR_TO_DATE': {
      const { usePreviousYear, numYearsLookback } = dateConfiguration;
      const lookbackYears =
        usePreviousYear && numYearsLookback > 0 ? numYearsLookback : 0;
      return {
        from: moment()
          .startOf('year')
          .subtract(lookbackYears, 'year'),
        to: moment().subtract(lookbackYears, 'year'),
      };
    }
    default:
      throw new Error(
        `Invalid modifier passed to computeDateRange: '${dateConfiguration.modifier}'`,
      );
  }
}
