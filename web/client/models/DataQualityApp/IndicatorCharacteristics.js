// @flow
import * as Zen from 'lib/Zen';
import Moment from 'models/core/wip/DateTime/Moment';
import { REPORTING_PERIOD_BOUNDS } from 'components/DataQualityApp/util';
import type { Serializable } from 'lib/Zen';

type Values = {
  ageScore: number,
  completenessTrendIsUp: boolean,
  /** Absolute first report ignoring any time filters applied to the query */
  firstEverReportDate: Moment,
  freshnessScore: number,
  lastReportAgeInMonths: number,
  /** Last report respecting any time filters applied to the query */
  lastReportDate: Moment,
  maxAgeScore: number,
  maxFreshnessScore: number,
  maxScore: number,
  reportingPeriod: number,
  score: number,
  success: boolean,
  endIntervalDate: Moment,
  success: boolean,
};

type SerializedIndicatorCharacteristics = {|
  ageScore: number,
  completenessTrendIsUp: boolean,
  endIntervalTimestamp: number,
  firstEverReportTimestamp: number,
  freshnessScore: number,
  lastReportAgeInMonths: number,
  lastReportTimestamp: number,
  maxAgeScore: number,
  maxFreshnessScore: number,
  maxScore: number,
  reportingPeriod: number,
  score: number,
  success: boolean,
|};

type DerivedValues = {
  age: number,
  displayedEstimatedReportingPeriod: string,
  lastReportAge: number,
  displayedTimeUnit: string,
};

const TEXT = t('DataQualityApp.IndicatorCharacteristicsTab');
const REPORTING_TEXT = t(
  'DataQualityApp.IndicatorCharacteristicsTab.reportingPeriodCard',
);

const DAYS = 'days';
const WEEKS = 'weeks';
const MONTHS = 'months';
const YEARS = 'years';

const TIME_UNIT_TEXT_MAP = {
  [DAYS]: TEXT.days,
  [WEEKS]: TEXT.weeks,
  [MONTHS]: TEXT.months,
  [YEARS]: TEXT.years,
};

function _getReportingTimeUnit(reportingPeriod): string {
  const { WEEKLY, MONTHLY, YEARLY } = REPORTING_PERIOD_BOUNDS;

  if (reportingPeriod < WEEKLY.lower) {
    return DAYS;
  }
  if (reportingPeriod < MONTHLY.lower) {
    return WEEKS;
  }
  if (reportingPeriod < YEARLY.lower) {
    return MONTHS;
  }
  return YEARS;
}

function _getDisplayedEstimatedReportingPeriod(reportingPeriod): string {
  const { DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY } = REPORTING_PERIOD_BOUNDS;
  if (reportingPeriod < DAILY.upper) {
    return REPORTING_TEXT.daily;
  }
  if (reportingPeriod >= WEEKLY.lower && reportingPeriod < WEEKLY.upper) {
    return REPORTING_TEXT.weekly;
  }
  if (reportingPeriod >= MONTHLY.lower && reportingPeriod < MONTHLY.upper) {
    return REPORTING_TEXT.monthly;
  }
  if (reportingPeriod > QUARTERLY.lower && reportingPeriod <= QUARTERLY.upper) {
    return REPORTING_TEXT.quarterly;
  }
  if (reportingPeriod > YEARLY.lower && reportingPeriod < YEARLY.upper) {
    return REPORTING_TEXT.yearly;
  }
  return REPORTING_TEXT.unknown;
}

/**
 * A model of the characteristics of an indicator that will be used on the
 * soon-to-be-made Indicator Characteristics tab of DQL
 */
class IndicatorCharacteristics
  extends Zen.BaseModel<IndicatorCharacteristics, Values, {}, DerivedValues>
  implements Serializable<SerializedIndicatorCharacteristics> {
  static derivedConfig: Zen.DerivedConfig<
    IndicatorCharacteristics,
    DerivedValues,
  > = {
    age: [
      Zen.hasChanged(
        'lastReportDate',
        'firstEverReportDate',
        'reportingPeriod',
      ),
      indicatorCharacteristics =>
        indicatorCharacteristics._.lastReportDate().diff(
          indicatorCharacteristics._.firstEverReportDate(),
          _getReportingTimeUnit(indicatorCharacteristics._.reportingPeriod()),
        ),
    ],
    displayedEstimatedReportingPeriod: [
      Zen.hasChanged('reportingPeriod'),
      indicatorCharacteristics =>
        _getDisplayedEstimatedReportingPeriod(
          indicatorCharacteristics._.reportingPeriod(),
        ),
    ],
    lastReportAge: [
      Zen.hasChanged('endIntervalDate', 'lastReportDate', 'reportingPeriod'),
      indicatorCharacteristics =>
        indicatorCharacteristics._.endIntervalDate().diff(
          indicatorCharacteristics._.lastReportDate(),
          _getReportingTimeUnit(indicatorCharacteristics._.reportingPeriod()),
        ),
    ],
    displayedTimeUnit: [
      Zen.hasChanged('reportingPeriod'),
      indicatorCharacteristics =>
        TIME_UNIT_TEXT_MAP[
          _getReportingTimeUnit(indicatorCharacteristics._.reportingPeriod())
        ],
    ],
  };

  static deserialize(
    serializedIndicatorCharacteristics: SerializedIndicatorCharacteristics,
  ): Zen.Model<IndicatorCharacteristics> {
    const {
      firstEverReportTimestamp,
      lastReportTimestamp,
      endIntervalTimestamp,
      ...otherValues
    } = serializedIndicatorCharacteristics;
    return IndicatorCharacteristics.create({
      firstEverReportDate: Moment.unix(firstEverReportTimestamp).utc(),
      lastReportDate: Moment.unix(lastReportTimestamp).utc(),
      endIntervalDate: Moment.unix(endIntervalTimestamp).utc(),
      ...otherValues,
    });
  }

  serialize(): SerializedIndicatorCharacteristics {
    const {
      ageScore,
      completenessTrendIsUp,
      endIntervalDate,
      firstEverReportDate,
      freshnessScore,
      lastReportAgeInMonths,
      lastReportDate,
      maxAgeScore,
      maxFreshnessScore,
      maxScore,
      reportingPeriod,
      score,
      success,
    } = this.modelValues();
    return {
      ageScore,
      completenessTrendIsUp,
      firstEverReportTimestamp: firstEverReportDate.unix(),
      endIntervalTimestamp: endIntervalDate.unix(),
      freshnessScore,
      lastReportAgeInMonths,
      lastReportTimestamp: lastReportDate.unix(),
      maxAgeScore,
      maxFreshnessScore,
      maxScore,
      reportingPeriod,
      score,
      success,
    };
  }
}

export default ((IndicatorCharacteristics: $Cast): Class<
  Zen.Model<IndicatorCharacteristics>,
>);
