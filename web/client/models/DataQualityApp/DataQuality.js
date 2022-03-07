// @flow

import * as Zen from 'lib/Zen';
import IndicatorCharacteristics from 'models/DataQualityApp/IndicatorCharacteristics';
import OutlierAnalysis from 'models/DataQualityApp/OutlierAnalysis';
import ReportingCompleteness from 'models/DataQualityApp/ReportingCompleteness';
import type { Serializable } from 'lib/Zen';

type geoPoint = {
  +lat: number,
  +lng: number,
};

type Values = {
  dimensions: { [dimensionName: string]: string },
  geo: geoPoint,
  indicatorCharacteristics: IndicatorCharacteristics,
  outlierAnalysis: OutlierAnalysis,
  reportingCompleteness: ReportingCompleteness,
};

type SerializedDataQuality = {
  dimensions: { [dimensionName: string]: string },
  geo: geoPoint,
  indicatorCharacteristics: Zen.Serialized<IndicatorCharacteristics>,
  outlierAnalysis: Zen.Serialized<OutlierAnalysis>,
  reportingCompleteness: Zen.Serialized<ReportingCompleteness>,
};

type DerivedValues = {
  maxScore: number,
  score: number,
  success: boolean,
};

/**
 * A summary of the Data quality information about a given indicator. This can
 * include geographical and time filters.
 */
class DataQuality extends Zen.BaseModel<DataQuality, Values, {}, DerivedValues>
  implements Serializable<SerializedDataQuality> {
  static derivedConfig: Zen.DerivedConfig<DataQuality, DerivedValues> = {
    score: [
      Zen.hasChangedDeep(
        'indicatorCharacteristics.score',
        'reportingCompleteness.score',
        'outlierAnalysis.score',
      ),
      dataQuality =>
        dataQuality.indicatorCharacteristics().score() +
        dataQuality.reportingCompleteness().score() +
        dataQuality.outlierAnalysis().score(),
    ],
    maxScore: [
      Zen.hasChangedDeep(
        'indicatorCharacteristics.maxScore',
        'reportingCompleteness.maxScore',
        'outlierAnalysis.maxScore',
      ),
      dataQuality =>
        dataQuality.indicatorCharacteristics().maxScore() +
        dataQuality.reportingCompleteness().maxScore() +
        dataQuality.outlierAnalysis().maxScore(),
    ],
    success: [
      Zen.hasChangedDeep(
        'indicatorCharacteristics.success',
        'reportingCompleteness.success',
        'outlierAnalysis.success',
      ),
      dataQuality =>
        dataQuality.indicatorCharacteristics().success() ||
        dataQuality.reportingCompleteness().success() ||
        dataQuality.outlierAnalysis().success(),
    ],
  };

  static deserialize(
    serializedDataQuality: SerializedDataQuality,
  ): Zen.Model<DataQuality> {
    const {
      indicatorCharacteristics,
      outlierAnalysis,
      reportingCompleteness,
      ...otherValues
    } = serializedDataQuality;
    return DataQuality.create({
      indicatorCharacteristics: IndicatorCharacteristics.deserialize(
        indicatorCharacteristics,
      ),
      outlierAnalysis: OutlierAnalysis.deserialize(outlierAnalysis),
      reportingCompleteness: ReportingCompleteness.deserialize(
        reportingCompleteness,
      ),
      ...otherValues,
    });
  }

  serialize(): SerializedDataQuality {
    const {
      indicatorCharacteristics,
      outlierAnalysis,
      reportingCompleteness,
      geo,
      dimensions,
    } = this.modelValues();
    return {
      indicatorCharacteristics: indicatorCharacteristics.serialize(),
      outlierAnalysis: outlierAnalysis.serialize(),
      reportingCompleteness: reportingCompleteness.serialize(),
      geo,
      dimensions,
    };
  }
}

export default ((DataQuality: $Cast): Class<Zen.Model<DataQuality>>);
