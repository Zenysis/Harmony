// @flow
import * as React from 'react';
import numeral from 'numeral';

import Card from 'components/ui/Card';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import InfoTooltip from 'components/ui/InfoTooltip';
import sortPipelineSummaries from 'models/DataDigestApp/sortPipelineSummaries';
import type PipelineDigest from 'models/DataDigestApp/PipelineDigest';
import type PipelineSummary from 'models/DataDigestApp/PipelineSummary';

type Props = {
  pipelineDigest: PipelineDigest,
  pipelineHistory: $ReadOnlyArray<PipelineSummary>,
};

/**
 * Render information about the pipeline summaries in an easy-to-digest manner.
 * For example, render the date of the most recent pipeline run.
 */
export default function SummaryInfoBlock({
  pipelineDigest,
  pipelineHistory,
}: Props): React.Node {
  const sortedSummaries = React.useMemo(
    () => sortPipelineSummaries(pipelineHistory),
    [pipelineHistory],
  );
  const mostRecentPipelineSummary = sortedSummaries[0];

  const maybeRenderDataPointStats = () => {
    if (mostRecentPipelineSummary.isGlobalPipelineSummary()) {
      return null;
    }

    const mostRecentGlobalSummary = pipelineDigest.getMostRecentGlobalSummary();
    const numDatapoints = mostRecentPipelineSummary.dataPointsCount();
    const totalDatapoints = mostRecentGlobalSummary.dataPointsCount();
    const percentageOfData = numDatapoints / totalDatapoints;
    return (
      <p>
        This datasource accounts for{' '}
        <b>{numeral(percentageOfData).format('0.00%')}</b> of all data.
      </p>
    );
  };

  return (
    <Group.Vertical>
      <Heading.Medium>Most recent pipeline</Heading.Medium>
      <Card>
        <p>
          The most recent pipeline completion was on{' '}
          <b>
            {mostRecentPipelineSummary
              .generationDate()
              .format('MMMM D, YYYY [at] HH:mm:ss')}
          </b>
          <InfoTooltip
            iconStyle={{ position: 'relative', top: 2 }}
            text="This time is when the 'index' step finished. The index step is when data gets added to the database."
          />
        </p>
        {maybeRenderDataPointStats()}
      </Card>
    </Group.Vertical>
  );
}
