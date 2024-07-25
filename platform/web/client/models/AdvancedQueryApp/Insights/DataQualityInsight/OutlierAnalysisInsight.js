// @flow
import * as Zen from 'lib/Zen';
import I18N from 'lib/I18N';
import { getDQLURL, TAB_NAMES } from 'components/DataQualityApp/util';
import type { DataQualityInsight } from 'models/AdvancedQueryApp/Insights/DataQualityInsight';
import type { DataQualityScore } from 'models/AdvancedQueryApp/Insights/DataQualityInsight/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';
import type { Serializable } from 'lib/Zen';

type Values = {|
  fieldId: string,
  score: DataQualityScore,
|};

// NOTE: Serialized version is the same as non-serialized for now.
type SerializedOutlierAnalysisInsight = Values;

class OutlierAnalysisInsight
  extends Zen.BaseModel<OutlierAnalysisInsight, Values>
  implements
    DataQualityInsight,
    Serializable<SerializedOutlierAnalysisInsight> {
  static deserialize(
    values: SerializedOutlierAnalysisInsight,
  ): Zen.Model<OutlierAnalysisInsight> {
    return OutlierAnalysisInsight.create({ ...values });
  }

  getURL(filters: $ReadOnlyArray<QueryFilterItem>): string {
    return getDQLURL(this._.fieldId(), TAB_NAMES.OUTLIER_ANALYSIS, filters);
  }

  summary(): string {
    return I18N.text(
      'The proportion of moderate and extreme outlier data points affects this score. Click here to see details and identify problematic facilities and geographies.',
    );
  }

  title(): string {
    return I18N.text('Data Outlier Analysis');
  }

  serialize(): SerializedOutlierAnalysisInsight {
    return this.modelValues();
  }
}

export default ((OutlierAnalysisInsight: $Cast): Class<
  Zen.Model<OutlierAnalysisInsight>,
>);
