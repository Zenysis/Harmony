// @flow
import * as Zen from 'lib/Zen';
import type OutlierAnalysisInsight from 'models/AdvancedQueryApp/Insights/DataQualityInsight/OutlierAnalysisInsight';
import type ReportingInsight from 'models/AdvancedQueryApp/Insights/DataQualityInsight/ReportingInsight';
import type ScoreCharacteristicInsight from 'models/AdvancedQueryApp/Insights/DataQualityInsight/ScoreCharacteristicInsight';

export type DataQualityScore = {|
  +maxScore: number,
  +value: number,
|};

type DataQualityInsightMap = {
  OUTLIER_ANALYSIS: OutlierAnalysisInsight,
  REPORTING: ReportingInsight,
  SCORE_CHARACTERISTIC: ScoreCharacteristicInsight,
};

export type DataQualityInsightItem = $Values<DataQualityInsightMap>;

export type SerializedDataQualityInsight =
  | {
      item: Zen.Serialized<ReportingInsight>,
      type: 'REPORTING',
    }
  | {
      item: Zen.Serialized<ScoreCharacteristicInsight>,
      type: 'SCORE_CHARACTERISTIC',
    }
  | {
      item: Zen.Serialized<OutlierAnalysisInsight>,
      type: 'OUTLIER_ANALYSIS',
    };
