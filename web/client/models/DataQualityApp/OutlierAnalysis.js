// @flow
import * as Zen from 'lib/Zen';
import Moment from 'models/core/wip/DateTime/Moment';
import type { Serializable } from 'lib/Zen';

type Values = {
  firstReportDate: Moment,
  maxScore: number,
  numFacilities: number,
  numValues: number,
  percentageExtremeOutliers: number,
  percentageModerateOutliers: number,
  score: number,
  success: boolean,
};

type SerializedOutlierAnalysis = {
  firstReportDate: string,
  numValues: number,
  numFacilities: number,
  maxScore: number,
  percentageExtremeOutliers: number,
  percentageModerateOutliers: number,
  score: number,
  success: boolean,
};

/**
 * Outlier Analysis data to be shown on the Data Outlier Analysis tab of DQL
 */
class OutlierAnalysis extends Zen.BaseModel<OutlierAnalysis, Values>
  implements Serializable<SerializedOutlierAnalysis> {
  static deserialize(
    serializedOutlierAnalysis: SerializedOutlierAnalysis,
  ): Zen.Model<OutlierAnalysis> {
    const { firstReportDate, ...otherValues } = serializedOutlierAnalysis;

    return OutlierAnalysis.create({
      firstReportDate: Moment.create(firstReportDate),
      ...otherValues,
    });
  }

  serialize(): SerializedOutlierAnalysis {
    const { firstReportDate, ...otherValues } = this.modelValues();

    return {
      ...otherValues,
      firstReportDate: firstReportDate.format('YYYY-MM-DD'),
    };
  }
}

export default ((OutlierAnalysis: $Cast): Class<Zen.Model<OutlierAnalysis>>);
