// @flow
import * as Zen from 'lib/Zen';
import OutlierAnalysisInsight from 'models/AdvancedQueryApp/Insights/DataQualityInsight/OutlierAnalysisInsight';
import ReportingInsight from 'models/AdvancedQueryApp/Insights/DataQualityInsight/ReportingInsight';
import ScoreCharacteristicInsight from 'models/AdvancedQueryApp/Insights/DataQualityInsight/ScoreCharacteristicInsight';
import type {
  DataQualityInsightItem,
  SerializedDataQualityInsight,
} from 'models/AdvancedQueryApp/Insights/DataQualityInsight/types';

/**
 * DataQualityInsightUtil is a static serializer/deserializer for all data
 * quality insight item types:
 *   - ReportingInsight
 *   - ScoreCharacteristicInsight
 *   - OutlierAnalysisInsight
 */
export default class DataQualityInsightUtil {
  static deserialize(
    values: SerializedDataQualityInsight,
  ): DataQualityInsightItem {
    const { type } = values;
    switch (values.type) {
      case 'REPORTING':
        return ReportingInsight.deserialize(values.item);
      case 'SCORE_CHARACTERISTIC':
        return ScoreCharacteristicInsight.deserialize(values.item);
      case 'OUTLIER_ANALYSIS':
        return OutlierAnalysisInsight.deserialize(values.item);
      default:
        throw new Error(
          `[DataQualityInsightUtil] Invalid insight item type '${type}' passed in deserialization`,
        );
    }
  }

  static serialize(item: DataQualityInsightItem): SerializedDataQualityInsight {
    if (item instanceof ReportingInsight) {
      return {
        item: Zen.cast<ReportingInsight>(item).serialize(),
        type: 'REPORTING',
      };
    }
    if (item instanceof ScoreCharacteristicInsight) {
      return {
        item: Zen.cast<ScoreCharacteristicInsight>(item).serialize(),
        type: 'SCORE_CHARACTERISTIC',
      };
    }
    if (item instanceof OutlierAnalysisInsight) {
      return {
        item: Zen.cast<OutlierAnalysisInsight>(item).serialize(),
        type: 'OUTLIER_ANALYSIS',
      };
    }
    throw new Error(
      '[DataQualityInsightUtil] Invalid insight item passed in serialization',
    );
  }
}
