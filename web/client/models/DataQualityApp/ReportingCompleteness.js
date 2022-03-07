// @flow
import * as Zen from 'lib/Zen';
import Moment from 'models/core/wip/DateTime/Moment';
import type { Serializable } from 'lib/Zen';

type Values = {
  averageReportCount: number,
  maxReportCount: number,
  maxScore: number,
  minReportCount: number,
  modeReportCount: number,
  reportCountStd: number,
  score: number,
  success: boolean,
  firstReportDate: Moment,
  totalReports: number,
};

type SerializedReportingCompleteness = {
  averageReportCount: number,
  maxReportCount: number,
  maxScore: number,
  minReportCount: number,
  modeReportCount: number,
  reportCountStd: number,
  score: number,
  success: boolean,
  firstReportTimestamp: number,
  totalReports: number,
};

/**
 * A model of reporting completeness data that is used on the Reporting
 * Completeness tab of DQL
 */
class ReportingCompleteness extends Zen.BaseModel<ReportingCompleteness, Values>
  implements Serializable<SerializedReportingCompleteness> {
  static deserialize(
    serializedReportingCompleteness: SerializedReportingCompleteness,
  ): Zen.Model<ReportingCompleteness> {
    const {
      firstReportTimestamp,
      ...otherValues
    } = serializedReportingCompleteness;

    return ReportingCompleteness.create({
      ...otherValues,
      firstReportDate: Moment.unix(firstReportTimestamp).utc(),
    });
  }

  serialize(): SerializedReportingCompleteness {
    const { firstReportDate, ...otherValues } = this.modelValues();
    return { firstReportTimestamp: firstReportDate.unix(), ...otherValues };
  }
}

export default ((ReportingCompleteness: $Cast): Class<
  Zen.Model<ReportingCompleteness>,
>);
