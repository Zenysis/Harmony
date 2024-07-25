// @flow
import * as Zen from 'lib/Zen';
import I18N from 'lib/I18N';
import { TAB_NAMES, getDQLURL } from 'components/DataQualityApp/util';
import type { DataQualityInsight } from 'models/AdvancedQueryApp/Insights/DataQualityInsight';
import type { DataQualityScore } from 'models/AdvancedQueryApp/Insights/DataQualityInsight/types';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';
import type { Serializable } from 'lib/Zen';

type Values = {|
  fieldId: string,
  score: DataQualityScore,
|};

// NOTE: Serialized version is the same as non-serialized for now.
type SerializedReportingInsight = Values;

class ReportingInsight extends Zen.BaseModel<ReportingInsight, Values>
  implements DataQualityInsight, Serializable<SerializedReportingInsight> {
  static deserialize(
    values: SerializedReportingInsight,
  ): Zen.Model<ReportingInsight> {
    return ReportingInsight.create({ ...values });
  }

  getURL(filters: $ReadOnlyArray<QueryFilterItem>): string {
    return getDQLURL(
      this._.fieldId(),
      TAB_NAMES.REPORTING_COMPLETENESS,
      filters,
    );
  }

  summary(): string {
    return I18N.text(
      'Consistency in number of reports received affects the score. Click here to analyze reporting trends & completeness by geography.',
    );
  }

  title(): string {
    return I18N.text('Reporting Completeness');
  }

  serialize(): SerializedReportingInsight {
    return this.modelValues();
  }
}

export default ((ReportingInsight: $Cast): Class<Zen.Model<ReportingInsight>>);
