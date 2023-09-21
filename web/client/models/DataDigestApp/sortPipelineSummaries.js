// @flow
import { sortDate } from 'util/arrayUtil';
import type PipelineSummary from 'models/DataDigestApp/PipelineSummary';

export default function sortPipelineSummaries(
  summaries: $ReadOnlyArray<PipelineSummary>,
): $ReadOnlyArray<PipelineSummary> {
  return [...summaries].sort((summary1, summary2) =>
    sortDate(summary1.generationDate(), summary2.generationDate(), true),
  );
}
