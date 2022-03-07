// @flow
import * as Zen from 'lib/Zen';
import Moment from 'models/core/wip/DateTime/Moment';
import PipelineSummary from 'models/DataDigestApp/PipelineSummary';
import memoizeOne from 'decorators/memoizeOne';
import {
  makeDatasourceId,
  GLOBAL_PIPELINE_SUMMARY_KEY,
} from 'models/DataDigestApp/types';
import { sortAlphabetic, sortDate } from 'util/arrayUtil';
import type { DatasourceId } from 'models/DataDigestApp/types';
import type { Deserializable } from 'lib/Zen';

type RequiredValues = {
  pipelineSummariesPerDatasource: $ReadOnlyMap<
    DatasourceId,
    $ReadOnlyArray<PipelineSummary>,
  >,

  /**
   * Summaries for the entire pipeline run, aggregating data across
   * all datasources.
   */
  globalSummaries: $ReadOnlyArray<PipelineSummary>,
};

type SerializedPipelineDigest = {
  +[DatasourceId]: $ReadOnlyArray<Zen.Serialized<PipelineSummary>>,
};

/**
 * Represents an overview of the pipeline digest metadata from the last week.
 * Includes a map of datasources to a list of objects that each represent a
 * single pipeline run for that source.
 */
class PipelineDigest extends Zen.BaseModel<PipelineDigest, RequiredValues>
  implements Deserializable<SerializedPipelineDigest> {
  static deserialize(
    values: SerializedPipelineDigest,
  ): Zen.Model<PipelineDigest> {
    // deserialize all summaries per datasource, but skip the global pipeline
    // summary, because this should be deserialized separately
    const pipelineSummariesPerDatasource = Object.keys(values)
      .map(makeDatasourceId)
      .reduce(
        (map, datasourceId) =>
          datasourceId === GLOBAL_PIPELINE_SUMMARY_KEY
            ? map
            : map.set(
                datasourceId,
                values[datasourceId].map(serializedSummary =>
                  PipelineSummary.deserialize(serializedSummary, {
                    datasource: datasourceId,
                  }),
                ),
              ),
        new Map(),
      );

    const globalSummaries = values[GLOBAL_PIPELINE_SUMMARY_KEY];
    if (!globalSummaries) {
      return PipelineDigest.create({
        pipelineSummariesPerDatasource,
        globalSummaries: [],
      });
    }

    return PipelineDigest.create({
      pipelineSummariesPerDatasource,
      globalSummaries: globalSummaries.map(serializedSummary =>
        PipelineSummary.deserialize(serializedSummary, {
          datasource: GLOBAL_PIPELINE_SUMMARY_KEY,
        }),
      ),
    });
  }

  isEmpty(): boolean {
    return this._.pipelineSummariesPerDatasource().size === 0;
  }

  /**
   * Get all the datasources for which we have a pipeline summary available
   */
  @memoizeOne
  getDatasourceNames(): $ReadOnlyArray<DatasourceId> {
    return [...this._.pipelineSummariesPerDatasource().keys()].sort(
      sortAlphabetic,
    );
  }

  getFirstDatasourceName(): DatasourceId {
    return this._.getDatasourceNames()[0];
  }

  getPipelineSummaries(
    sourcename: DatasourceId,
  ): $ReadOnlyArray<PipelineSummary> | void {
    if (sourcename === GLOBAL_PIPELINE_SUMMARY_KEY) {
      return this._.globalSummaries();
    }
    return this._.pipelineSummariesPerDatasource().get(sourcename);
  }

  /**
   * Given a date, get all the pipeline summary for each datasource that
   * match this date exactly.
   */
  getPipelineSummariesByDate(
    date: Moment,
  ): $ReadOnlyMap<DatasourceId, PipelineSummary> {
    const fullDateFormat = 'YYYY-MM-DD hh:mm:ss';
    const dateStr = date.format(fullDateFormat);
    return [...this._.pipelineSummariesPerDatasource().entries()].reduce(
      (map, [datasource, summaries]) => {
        const summary = summaries.find(
          s => s.generationDate().format(fullDateFormat) === dateStr,
        );
        if (summary) {
          return map.set(datasource, summary);
        }
        return map;
      },
      new Map(),
    );
  }

  @memoizeOne
  getMostRecentGlobalSummary(): PipelineSummary {
    const sortedSummaries = [...this._.globalSummaries()].sort((s1, s2) =>
      sortDate(s1.generationDate(), s2.generationDate(), true),
    );
    return sortedSummaries[0];
  }
}

export default ((PipelineDigest: $Cast): Class<Zen.Model<PipelineDigest>>);
