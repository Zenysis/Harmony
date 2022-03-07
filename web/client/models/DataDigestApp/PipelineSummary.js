// @flow
import * as Zen from 'lib/Zen';
import Moment from 'models/core/wip/DateTime/Moment';
import memoizeOne from 'decorators/memoizeOne';
import { GLOBAL_PIPELINE_SUMMARY_KEY } from 'models/DataDigestApp/types';
import type { DatasourceId } from 'models/DataDigestApp/types';
import type { Deserializable } from 'lib/Zen';

type RequiredValues = {
  datasource: DatasourceId,
  dataPointsCount: number,
  endDate: Moment,
  fieldsCount: number,
  generationDate: Moment,
  mappedLocationsCount: number,
  startDate: Moment,
  unmatchedLocationsCount: number,
};

type SerializedPipelineSummary = {
  dataPointsCount: number,
  endDate: string,
  fieldsCount: number,
  generationDatetime: string,
  mappedLocationsCount: number,
  startDate: string,
  unmatchedLocationsCount: number,
};

type DeserializationConfig = {
  datasource: DatasourceId,
};

class PipelineSummary extends Zen.BaseModel<PipelineSummary, RequiredValues>
  implements Deserializable<SerializedPipelineSummary, DeserializationConfig> {
  static deserialize(
    values: SerializedPipelineSummary,
    extraConfig: DeserializationConfig,
  ): Zen.Model<PipelineSummary> {
    const {
      dataPointsCount,
      generationDatetime,
      endDate,
      fieldsCount,
      startDate,
      unmatchedLocationsCount,
      mappedLocationsCount,
    } = values;
    const { datasource } = extraConfig;
    return PipelineSummary.create({
      datasource,
      dataPointsCount,
      fieldsCount,
      mappedLocationsCount,
      unmatchedLocationsCount,
      endDate: Moment.utc(endDate),
      generationDate: Moment.utc(generationDatetime).local(),
      startDate: Moment.utc(startDate),
    });
  }

  isGlobalPipelineSummary(): boolean {
    return this._.datasource() === GLOBAL_PIPELINE_SUMMARY_KEY;
  }

  @memoizeOne
  getFullGenerationTime(): string {
    return this._.generationDate()
      .format('YYYY-MM-DD HH:mm:ss');
  }
}

export default ((PipelineSummary: $Cast): Class<Zen.Model<PipelineSummary>>);
