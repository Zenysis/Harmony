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
type SerializedScoreCharacteristicInsight = Values;

class ScoreCharacteristicInsight
  extends Zen.BaseModel<ScoreCharacteristicInsight, Values>
  implements
    DataQualityInsight,
    Serializable<SerializedScoreCharacteristicInsight> {
  static deserialize(
    values: SerializedScoreCharacteristicInsight,
  ): Zen.Model<ScoreCharacteristicInsight> {
    return ScoreCharacteristicInsight.create({ ...values });
  }

  getURL(filters: $ReadOnlyArray<QueryFilterItem>): string {
    return getDQLURL(
      this._.fieldId(),
      TAB_NAMES.INDICATOR_CHARACTERISTICS,
      filters,
    );
  }

  summary(): string {
    return I18N.text(
      'Indicator age, data freshness, and recent reporting trends contribute to this score.',
    );
  }

  title(): string {
    return I18N.text('Indicator Characteristics');
  }

  serialize(): SerializedScoreCharacteristicInsight {
    return this.modelValues();
  }
}

export default ((ScoreCharacteristicInsight: $Cast): Class<
  Zen.Model<ScoreCharacteristicInsight>,
>);
