// @flow
import * as Zen from 'lib/Zen';
import I18N from 'lib/I18N';
import Moment from 'models/core/wip/DateTime/Moment';
import { REPORTING_PERIOD_BOUNDS } from 'components/DataQualityApp/util';
import type { Serializable } from 'lib/Zen';

type Values = {
  ageScore: number,
  completenessTrendIsUp: boolean,
  endIntervalDate: Moment,
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
  displayedTimeUnit: string,
  lastReportAge: number,
};

const DAYS = 'days';
const WEEKS = 'weeks';
const MONTHS = 'months';
const YEARS = 'years';

const TIME_UNIT_TEXT_MAP = {
  [DAYS]: I18N.text('Days'),
  [MONTHS]: I18N.text('Months'),
  [WEEKS]: I18N.text('Weeks'),
  [YEARS]: I18N.text('Years'),
};

function _getReportingTimeUnit(reportingPeriod): string {
  const { MONTHLY, WEEKLY, YEARLY } = REPORTING_PERIOD_BOUNDS;

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
  const { DAILY, MONTHLY, QUARTERLY, WEEKLY, YEARLY } = REPORTING_PERIOD_BOUNDS;
  if (reportingPeriod < DAILY.upper) {
    return I18N.textById('Daily');
  }
  if (reportingPeriod >= WEEKLY.lower && reportingPeriod < WEEKLY.upper) {
    return I18N.textById('Weekly');
  }
  if (reportingPeriod >= MONTHLY.lower && reportingPeriod < MONTHLY.upper) {
    return I18N.textById('Monthly');
  }
  if (reportingPeriod > QUARTERLY.lower && reportingPeriod <= QUARTERLY.upper) {
    return I18N.text('Quarterly');
  }
  if (reportingPeriod > YEARLY.lower && reportingPeriod < YEARLY.upper) {
    return I18N.text('Yearly');
  }
  return I18N.text('Unknown');
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
    displayedTimeUnit: [
      Zen.hasChanged('reportingPeriod'),
      indicatorCharacteristics =>
        TIME_UNIT_TEXT_MAP[
          _getReportingTimeUnit(indicatorCharacteristics._.reportingPeriod())
        ],
    ],
    lastReportAge: [
      Zen.hasChanged('endIntervalDate', 'lastReportDate', 'reportingPeriod'),
      indicatorCharacteristics =>
        indicatorCharacteristics._.endIntervalDate().diff(
          indicatorCharacteristics._.lastReportDate(),
          _getReportingTimeUnit(indicatorCharacteristics._.reportingPeriod()),
        ),
    ],
  };

  static deserialize(
    serializedIndicatorCharacteristics: SerializedIndicatorCharacteristics,
  ): Zen.Model<IndicatorCharacteristics> {
    const {
      endIntervalTimestamp,
      firstEverReportTimestamp,
      lastReportTimestamp,
      ...otherValues
    } = serializedIndicatorCharacteristics;
    return IndicatorCharacteristics.create({
      endIntervalDate: Moment.unix(endIntervalTimestamp).utc(),
      firstEverReportDate: Moment.unix(firstEverReportTimestamp).utc(),
      lastReportDate: Moment.unix(lastReportTimestamp).utc(),
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
      freshnessScore,
      lastReportAgeInMonths,
      maxAgeScore,
      maxFreshnessScore,
      maxScore,
      reportingPeriod,
      score,
      success,
      endIntervalTimestamp: endIntervalDate.unix(),
      firstEverReportTimestamp: firstEverReportDate.unix(),
      lastReportTimestamp: lastReportDate.unix(),
    };
  }
}

export default ((IndicatorCharacteristics: $Cast): Class<
  Zen.Model<IndicatorCharacteristics>,
>);
