// @flow
import * as React from 'react';
import numeral from 'numeral';

import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import InfoTooltip from 'components/ui/InfoTooltip';
import Table from 'components/ui/Table';
import sortPipelineSummaries from 'models/DataDigestApp/sortPipelineSummaries';
import type PipelineSummary from 'models/DataDigestApp/PipelineSummary';

type Props = {
  summaries: $ReadOnlyArray<PipelineSummary>,
};

const TABLE_HEADERS = [
  {
    displayContent: 'Pipeline Run Time',
    id: 'generationDate',
    sortFn: Table.Sort.moment(d => d.generationDate()),
  },
  {
    displayContent: 'Number of Datapoints',
    id: 'dataPointsCount',
  },
  {
    displayContent: 'Number of Indicators',
    id: 'fieldsCount',
  },
  {
    displayContent: 'Start Date',
    id: 'startDate',
  },
  {
    displayContent: 'End Date',
    id: 'endDate',
  },
];

function getAverageTimeBetweenPipelines(
  sortedSummaries: $ReadOnlyArray<PipelineSummary>,
): { avgTimeDiff: number, timeUnit: 'seconds' | 'minutes' | 'hours' | 'days' } {
  let totalDiffSeconds = 0;
  for (let i = 1; i < sortedSummaries.length; i++) {
    const date1 = sortedSummaries[i - 1].generationDate();
    const date2 = sortedSummaries[i].generationDate();
    totalDiffSeconds += date1.diff(date2, 'seconds');
  }

  const numDifferences = sortedSummaries.length - 1;
  const avgTimeDiffSeconds = totalDiffSeconds / numDifferences;
  if (avgTimeDiffSeconds < 60) {
    return { avgTimeDiff: avgTimeDiffSeconds, timeUnit: 'seconds' };
  }
  if (avgTimeDiffSeconds < 3600) {
    return { avgTimeDiff: avgTimeDiffSeconds / 60, timeUnit: 'minutes' };
  }
  if (avgTimeDiffSeconds < 86400) {
    return { avgTimeDiff: avgTimeDiffSeconds / 3600, timeUnit: 'hours' };
  }
  return { avgTimeDiff: avgTimeDiffSeconds / (3600 * 24), timeUnit: 'days' };
}

export default function PipelineSummariesTable({
  summaries,
}: Props): React.Node {
  const sortedSummaries = React.useMemo(
    () => sortPipelineSummaries(summaries),
    [summaries],
  );

  const avgTimeBetweenRuns = React.useMemo(
    () => getAverageTimeBetweenPipelines(sortedSummaries),
    [sortedSummaries],
  );

  const maybeRenderAverageTimeBetweenPipelines = () => {
    if (sortedSummaries.length <= 1) {
      return null;
    }

    return (
      <>
        <p>
          The pipeline runs on average every{' '}
          <b>
            {numeral(avgTimeBetweenRuns.avgTimeDiff).format('0.[00]')}{' '}
            {avgTimeBetweenRuns.timeUnit}
          </b>
          <InfoTooltip
            iconStyle={{ position: 'relative', top: 2 }}
            text="This looks at the average time between pipeline completions, not pipeline start times"
          />
        </p>
      </>
    );
  };

  const renderTableRow = React.useCallback((summary: PipelineSummary) => {
    const generationDateString = summary.getFullGenerationTime();

    return (
      <Table.Row id={generationDateString}>
        <Table.Cell>{generationDateString}</Table.Cell>
        <Table.Cell>{summary.dataPointsCount().toLocaleString()}</Table.Cell>
        <Table.Cell>{summary.fieldsCount().toLocaleString()}</Table.Cell>
        <Table.Cell>{summary.startDate().format('YYYY-MM-DD')}</Table.Cell>
        <Table.Cell>{summary.endDate().format('YYYY-MM-DD')}</Table.Cell>
      </Table.Row>
    );
  }, []);

  return (
    <Group.Vertical>
      <Heading.Medium>Pipeline History</Heading.Medium>
      {maybeRenderAverageTimeBetweenPipelines()}
      <div className="dd-table-container">
        <Table
          adjustWidthsToContent
          className="dd-table-container__table"
          data={summaries}
          headers={TABLE_HEADERS}
          initialColumnSortOrder="DESC"
          initialColumnToSort="generationDate"
          pageSize={20}
          renderRow={renderTableRow}
        />
      </div>
    </Group.Vertical>
  );
}
