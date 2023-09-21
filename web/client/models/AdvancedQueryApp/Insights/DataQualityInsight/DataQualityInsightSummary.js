// @flow
import * as Zen from 'lib/Zen';
import DataQualityInsightUtil from 'models/AdvancedQueryApp/Insights/DataQualityInsight/DataQualityInsightUtil';
import type {
  DataQualityInsightItem,
  DataQualityScore,
  SerializedDataQualityInsight,
} from 'models/AdvancedQueryApp/Insights/DataQualityInsight/types';
import type { Serializable } from 'lib/Zen';

type Values = {
  // A collection of DataQuality insights for an individual field.
  insights: $ReadOnlyArray<DataQualityInsightItem>,
};

type SerializedDataQualityInsightSummary = {
  insights: $ReadOnlyArray<SerializedDataQualityInsight>,
};

type DerivedValues = {
  // The overall DataQuality score for an individual field.
  overallScore: DataQualityScore,
};

class DataQualityInsightSummary
  extends Zen.BaseModel<DataQualityInsightSummary, Values, {}, DerivedValues>
  implements Serializable<SerializedDataQualityInsightSummary> {
  static derivedConfig: Zen.DerivedConfig<
    DataQualityInsightSummary,
    DerivedValues,
  > = {
    overallScore: [
      Zen.hasChanged('insights'),
      dataQualityInsightSummary => {
        const insightScores = dataQualityInsightSummary
          .insights()
          .map(insight => insight.get('score'));

        const maxScore = insightScores.reduce(
          (acc, score) => acc + score.maxScore,
          0,
        );
        const value = insightScores.reduce(
          (acc, score) => acc + score.value,
          0,
        );
        return { maxScore, value };
      },
    ],
  };

  static deserialize(
    values: SerializedDataQualityInsightSummary,
  ): Zen.Model<DataQualityInsightSummary> {
    return DataQualityInsightSummary.create({
      insights: values.insights.map(DataQualityInsightUtil.deserialize),
    });
  }

  serialize(): SerializedDataQualityInsightSummary {
    return {
      insights: this._.insights().map(DataQualityInsightUtil.serialize),
    };
  }
}

export default ((DataQualityInsightSummary: $Cast): Class<
  Zen.Model<DataQualityInsightSummary>,
>);
