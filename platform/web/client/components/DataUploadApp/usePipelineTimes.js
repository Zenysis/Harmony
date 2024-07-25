// @flow
import { useLazyLoadQuery } from 'react-relay/hooks';
import { useMemo } from 'react';

import Moment from 'models/core/wip/DateTime/Moment';
import { GLOBAL_PIPELINE_SUMMARY_KEY } from 'models/DataDigestApp/types';
import type { usePipelineTimesHistoricalPipelinesQuery } from './__generated__/usePipelineTimesHistoricalPipelinesQuery.graphql';
import type { usePipelineTimesLastPipelineQuery } from './__generated__/usePipelineTimesLastPipelineQuery.graphql';
import type { usePipelineTimesLastSuccessfulPipelineQuery } from './__generated__/usePipelineTimesLastSuccessfulPipelineQuery.graphql';

// Use data from the last 2 weeks.
// NOTE: Use startOf here so this query isn't constantly being refetched.
const TIME_WINDOW = Moment.create()
  .subtract(2, 'weeks')
  .startOf('day')
  .format('YYYY-MM-DDTHH:mm:ss');

export default function usePipelineTimes(): {
  lastPipelineRuntime: Moment | void,
  nextPipelineRuntime: Moment | void,
} {
  // NOTE: Do two extra requests here to ensure a last pipeline date time is retrieved, even
  // if it's not in the last two weeks.
  const lastSuccessfulPipelineData = useLazyLoadQuery<usePipelineTimesLastSuccessfulPipelineQuery>(
    graphql`
      query usePipelineTimesLastSuccessfulPipelineQuery(
        $allSourcesName: String!
        $unsuccessfulFilter: jsonb!
      ) {
        pipelineRunMetadataConnection: pipeline_run_metadata_connection(
          where: {
            source: { _eq: $allSourcesName }
            _not: { digest_metadata: { _contains: $unsuccessfulFilter } }
          }
          order_by: { generation_datetime: desc }
          first: 1
        ) {
          edges {
            node {
              generationDatetime: generation_datetime
            }
          }
        }
      }
    `,
    {
      allSourcesName: GLOBAL_PIPELINE_SUMMARY_KEY,
      unsuccessfulFilter: { failed: true },
    },
  );

  const lastPipelineRun = useLazyLoadQuery<usePipelineTimesLastPipelineQuery>(
    graphql`
      query usePipelineTimesLastPipelineQuery($allSourcesName: String!) {
        pipelineRunMetadataConnection: pipeline_run_metadata_connection(
          where: {
            source: { _eq: $allSourcesName }
            digest_metadata: { _has_key: "next_run" }
          }
          order_by: { generation_datetime: desc }
          first: 1
        ) {
          edges {
            node {
              nextRun: digest_metadata(path: "next_run")
            }
          }
        }
      }
    `,
    { allSourcesName: GLOBAL_PIPELINE_SUMMARY_KEY },
  );

  const successfulHistoricalPipelines = useLazyLoadQuery<usePipelineTimesHistoricalPipelinesQuery>(
    graphql`
      query usePipelineTimesHistoricalPipelinesQuery(
        $allSourcesName: String!
        $timeWindow: timestamp!
        $unsuccessfulFilter: jsonb!
      ) {
        pipelineRunMetadataConnection: pipeline_run_metadata_connection(
          where: {
            source: { _eq: $allSourcesName }
            generation_datetime: { _gte: $timeWindow }
            _not: { digest_metadata: { _contains: $unsuccessfulFilter } }
            digest_metadata: { _has_key: "start_ts" }
          }
          order_by: { generation_datetime: desc }
        ) {
          edges {
            node {
              generationDatetime: generation_datetime
              startTS: digest_metadata(path: "start_ts")
            }
          }
        }
      }
    `,
    {
      allSourcesName: GLOBAL_PIPELINE_SUMMARY_KEY,
      timeWindow: TIME_WINDOW,
      unsuccessfulFilter: { failed: true },
    },
  ).pipelineRunMetadataConnection.edges;

  return useMemo(() => {
    const lastPipelineRuntime = lastSuccessfulPipelineData
      .pipelineRunMetadataConnection.edges.length
      ? Moment.utc(
          lastSuccessfulPipelineData.pipelineRunMetadataConnection.edges[0].node
            .generationDatetime,
        ).local()
      : undefined;

    const nextRun = lastPipelineRun.pipelineRunMetadataConnection.edges.length
      ? Moment.utc(
          lastPipelineRun.pipelineRunMetadataConnection.edges[0].node.nextRun,
        )
      : undefined;

    if (successfulHistoricalPipelines.length && nextRun) {
      const historicalRuntimes = successfulHistoricalPipelines.map(edge =>
        Moment.utc(edge.node.generationDatetime).diff(
          Moment.utc(edge.node.startTS),
        ),
      );
      const avgRuntime =
        historicalRuntimes.reduce((a, b) => a + b) / historicalRuntimes.length;

      // NOTE: The pipeline run metadata datetimes are stored in UTC, then converted here to
      // the local timezone to display.
      const nextPipelineRuntime = nextRun
        .add(avgRuntime, 'milliseconds')
        .local();
      return {
        lastPipelineRuntime,
        nextPipelineRuntime: nextPipelineRuntime.isBefore(Moment.create())
          ? undefined
          : nextPipelineRuntime,
      };
    }

    return { lastPipelineRuntime, nextPipelineRuntime: undefined };
  }, [
    lastSuccessfulPipelineData,
    lastPipelineRun,
    successfulHistoricalPipelines,
  ]);
}
