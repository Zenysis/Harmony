// @flow
import * as Zen from 'lib/Zen';
import Moment from 'models/core/wip/DateTime/Moment';
import { round } from 'util/numberUtil';
import type { Serializable } from 'lib/Zen';

type Values = {
  /**
   * The full location hierarchy for this location including all parent
   * dimensions and their values.
   */
  geographyHierarchy: $ReadOnly<{ [dimensionName: string]: string }>,

  /**
   * The last date a report was sent by this location for the selected
   * indicator.
   */
  lastReport: Moment,

  /** The total number of reporting periods within the date filter */
  numPeriods: number,

  /**
   * The number of reporting periods with a report for the selected indicator
   */
  numPeriodsWithReport: number,

  /** The number of days since the last report */
  silentDays: number,
};

type DerivedValues = {
  /**
   * The number of reporting periods without a report for the selected
   * indicator
   */
  numPeriodsWithNoReport: number,

  /**
   * The percentage of reporting periods with a report for the selected
   * indicator
   */
  percentagePeriodsWithReport: number,
};

type SerializedLocationReportingInfo = {
  lastReport: number,
  numPeriods: number,
  geographyHierarchy: $ReadOnly<{ [dimensionName: string]: string }>,
  numPeriodsWithReport: number,
  silentDays: number,
};

/** A summary of reporting information for a particular location */
class LocationReportingInfo
  extends Zen.BaseModel<LocationReportingInfo, Values, {}, DerivedValues>
  implements Serializable<SerializedLocationReportingInfo> {
  static derivedConfig: Zen.DerivedConfig<
    LocationReportingInfo,
    DerivedValues,
  > = {
    numPeriodsWithNoReport: [
      Zen.hasChanged('numPeriodsWithReport', 'numPeriods'),
      locationReportingInfo =>
        locationReportingInfo._.numPeriods() -
        locationReportingInfo._.numPeriodsWithReport(),
    ],
    percentagePeriodsWithReport: [
      Zen.hasChanged('numPeriodsWithReport', 'numPeriods'),
      locationReportingInfo =>
        round(
          (locationReportingInfo._.numPeriodsWithReport() * 100) /
            locationReportingInfo.numPeriods(),
          2,
        ),
    ],
  };

  static deserialize(
    serializedLocationReportingInfo: SerializedLocationReportingInfo,
  ): Zen.Model<LocationReportingInfo> {
    const { lastReport, ...otherValues } = serializedLocationReportingInfo;
    return LocationReportingInfo.create({
      lastReport: Moment.utc(serializedLocationReportingInfo.lastReport),
      ...otherValues,
    });
  }

  serialize(): SerializedLocationReportingInfo {
    const {
      geographyHierarchy,
      lastReport,
      numPeriods,
      numPeriodsWithReport,
      silentDays,
    } = this._.modelValues();
    return {
      geographyHierarchy,
      lastReport: lastReport.millisecond(),
      numPeriods,
      numPeriodsWithReport,
      silentDays,
    };
  }
}

export default ((LocationReportingInfo: $Cast): Class<
  Zen.Model<LocationReportingInfo>,
>);
