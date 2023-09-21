// @flow
import * as React from 'react';
import classNames from 'classnames';
import { useFragment } from 'react-relay/hooks';

import ActionCell from 'components/DataUploadApp/SourceTable/ActionCell';
import AuthorizationService from 'services/AuthorizationService';
import DataUploadService from 'services/DataUploadService';
import I18N from 'lib/I18N';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import Moment from 'models/core/wip/DateTime/Moment';
import Table from 'components/ui/Table';
import { CSV_TYPE, DATAPREP_TYPE } from 'models/DataUploadApp/types';
import {
  DATE_FORMAT,
  DATE_TIME_FORMAT,
  FAILED_DATAPREP_STATUSES,
  RUNNING_DATAPREP_STATUSES,
} from 'components/DataUploadApp/constants';
import {
  SITE_PERMISSIONS,
  RESOURCE_TYPES,
} from 'services/AuthorizationService/registry';
import { cancelPromise } from 'util/promiseUtil';
import { localizeUrl } from 'components/Navbar/util';
import { noop } from 'util/util';
import type { DataUploadSource } from 'components/DataUploadApp/SourceTable/ActionCell';
import type { SourceDateRanges } from 'models/DataUploadApp/types';
import type { SourceTable_selfServeSource$key } from './__generated__/SourceTable_selfServeSource.graphql';
import type { TableHeader } from 'components/ui/Table';

// NOTE: Just using any here because it's very difficult to get the nested graphQL type.
export const HEADERS: $ReadOnlyArray<TableHeader<any>> = [
  {
    displayContent: I18N.textById('Datasource'),
    id: 'datasource',
    sortFn: Table.Sort.string(source => source.pipelineDatasource.name),
  },
  {
    displayContent: I18N.text('Integration type'),
    id: 'integrationType',
    sortFn: Table.Sort.string(source =>
      source.dataprepFlow ? DATAPREP_TYPE : CSV_TYPE,
    ),
  },
  {
    displayContent: I18N.text('Last updated'),
    id: 'lastUpdated',
    sortFn: Table.Sort.moment(source => Moment.utc(source.lastModified)),
  },
  {
    displayContent: I18N.text('Time range of data'),
    id: 'timeRange',
  },
  {
    displayContent: I18N.text('New indicator count'),
    id: 'newIndicatorCount',
    sortFn: Table.Sort.number(
      source =>
        source.pipelineDatasource.unpublishedFieldsCount.aggregate?.count || 0,
    ),
  },
  { displayContent: I18N.text('Manage'), id: 'manage' },
].map(header => ({
  ...header,
  headerClassName: 'data-status-table__header-cell',
}));

type Props = {
  buildOnOpenModal: DataUploadSource => () => void,
  isRefetching: boolean,
  isSelfServeAdmin: boolean,
  lastPipelineRuntime: Moment | void,
  refetchDataprepJobs: () => void,
  sourceTableRef: SourceTable_selfServeSource$key,
};

export default function SourceTable({
  buildOnOpenModal,
  isRefetching,
  isSelfServeAdmin,
  lastPipelineRuntime,
  refetchDataprepJobs,
  sourceTableRef,
}: Props): React.Node {
  // Source date ranges are queried directly from druid, so store them separately
  // from the rest of the query data
  const [
    sourceDateRanges,
    setSourceDateRanges,
  ] = React.useState<SourceDateRanges | void>(undefined);

  const [canViewFieldSetup, setCanViewFieldSetup] = React.useState<boolean>(
    false,
  );

  React.useEffect(() => {
    const promise = AuthorizationService.isAuthorized(
      SITE_PERMISSIONS.CAN_VIEW_FIELD_SETUP,
      RESOURCE_TYPES.SITE,
    ).then(isAuthorized => {
      setCanViewFieldSetup(isAuthorized);
    });
    return () => cancelPromise(promise);
  });

  const queryData = useFragment(
    graphql`
      fragment SourceTable_selfServeSource on self_serve_sourceConnection {
        edges {
          node {
            sourceId: source_id
            pipelineDatasource: pipeline_datasource {
              name
              unpublishedFieldsCount: unpublished_field_pipeline_datasource_mappings_aggregate {
                aggregate {
                  count
                }
              }
            }
            lastModified: last_modified
            latestFileSummary: data_upload_file_summaries(
              order_by: { last_modified: desc }
              limit: 1
            ) {
              lastModified: last_modified
            }
            dataprepFlow: dataprep_flow {
              dataprepJobs: dataprep_jobs(
                limit: 1
                order_by: { created: desc }
              ) {
                lastModifiedOnDataprep: last_modified_on_dataprep
                status
              }
            }
            ...ActionCell_selfServeSource
          }
        }
      }
    `,
    sourceTableRef,
  );

  const [
    dataprepSourcesLoaded,
    setDataprepSourcesLoaded,
  ] = React.useState<boolean>(false);
  React.useEffect(() => {
    // Only make the API call if there are incomplete statuses.
    if (
      queryData.edges.some(
        edge =>
          edge.node.dataprepFlow &&
          RUNNING_DATAPREP_STATUSES.has(
            edge.node.dataprepFlow.dataprepJobs[0]?.status,
          ),
      )
    ) {
      const promise = DataUploadService.updateAllDataprepJobs().then(() => {
        refetchDataprepJobs();
        setDataprepSourcesLoaded(true);
      });
      return () => cancelPromise(promise);
    }
    setDataprepSourcesLoaded(true);
    // NOTE: Have a consistent return type even if the API call isn't made
    return noop;
    // NOTE: Only trigger once on page load since the dataprep jobs only need
    // to be updated once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const sourceDateRangesPromise = DataUploadService.getSourceDateRanges().then(
      setSourceDateRanges,
    );
    return () => cancelPromise(sourceDateRangesPromise);
  }, []);

  const getDateRangeCell = (
    sourceId: string,
    queuedStatus: boolean,
  ): React.Node => {
    if (!sourceDateRanges) {
      return <LoadingSpinner />;
    }
    const noInfo = queuedStatus ? (
      <I18N>Date range information will appear on next pipeline run</I18N>
    ) : (
      <I18N>No date range information</I18N>
    );
    // NOTE: We don't call the get source date ranges service function
    // when we add a new source, because the new data will not be integrated yet
    // into druid, which is where we get the date range info. Therefore, the new
    // source will be missing from the sourceDateRanges, which is the case we
    // handle here. New dataprep sources will already exist, so they will have
    // already loaded.
    if (!sourceDateRanges[sourceId]) {
      return noInfo;
    }
    const { endDate, startDate } = sourceDateRanges[sourceId];
    if (!startDate || !endDate) {
      return noInfo;
    }
    return (
      <React.Fragment>
        {Moment.create(startDate).format(DATE_FORMAT)} -
        {Moment.create(endDate).format(DATE_FORMAT)}
      </React.Fragment>
    );
  };

  const getNewIndicatorCountCell = (newIndicatorCount: number): React.Node => (
    <React.Fragment>
      <div>
        {I18N.text(
          {
            one: '%(count)s new indicator',
            other: '%(count)s new indicators',
            zero: 'No new indicators',
          },
          'unpublished-indicators-count',
          { count: newIndicatorCount },
        )}
      </div>
      {canViewFieldSetup && newIndicatorCount > 0 && (
        <a href={localizeUrl('/indicator-setup')}>
          {I18N.text('Go to setup page')}
        </a>
      )}
    </React.Fragment>
  );

  // A source is queued if the pipeline has not run since it's been modified. For dataprep
  // sources, also check if the pipeline has run since the dataprep finished running.
  const isSourceQueued = (source, lastModified: Moment): boolean => {
    const { dataprepFlow, latestFileSummary } = source;
    // No attached files is an error state, not queued.
    if (latestFileSummary.length === 0) {
      return false;
    }

    const pipelineQueued = lastPipelineRuntime
      ? lastPipelineRuntime.isBefore(lastModified)
      : true;

    if (dataprepFlow && lastPipelineRuntime) {
      const dataprepJob = dataprepFlow.dataprepJobs[0];
      if (dataprepJob !== undefined) {
        // If lastModifiedOnDataprep is null, then the job failed and the source is not queued.
        if (!dataprepJob.lastModifiedOnDataprep) {
          return false;
        }

        const dataprepUpdatedTime = Moment.utc(
          dataprepJob.lastModifiedOnDataprep,
        ).local();
        return (
          pipelineQueued ||
          RUNNING_DATAPREP_STATUSES.has(dataprepJob.status) ||
          lastPipelineRuntime.isBefore(dataprepUpdatedTime)
        );
      }
    }

    return pipelineQueued;
  };

  // If the source is no longer queued and there's no data in Druid, then the update failed.
  // Or if there aren't any file summaries (which shouldn't happen and signifies a bad database
  // state). For Dataprep sources, also check if the status of the Dataprep job failed.
  const didUpdateFail = (source, queuedStatus): boolean => {
    const { dataprepFlow, latestFileSummary, sourceId } = source;
    const updateFailed =
      (!queuedStatus &&
        !!sourceDateRanges &&
        (!sourceDateRanges[sourceId] ||
          !sourceDateRanges[sourceId].startDate ||
          !sourceDateRanges[sourceId].endDate)) ||
      latestFileSummary.length === 0;

    if (dataprepFlow) {
      const dataprepJob = dataprepFlow.dataprepJobs[0];
      if (dataprepJob !== undefined) {
        return updateFailed || FAILED_DATAPREP_STATUSES.has(dataprepJob.status);
      }
    }

    return updateFailed;
  };

  const renderActionCell = (source, queuedStatus: boolean) => {
    const isLoaded =
      !source.dataprepFlow ||
      !RUNNING_DATAPREP_STATUSES.has(
        source.dataprepFlow.dataprepJobs[0]?.status,
      ) ||
      (dataprepSourcesLoaded && !isRefetching);

    if (!isLoaded) {
      return (
        <Table.Cell className="data-status-table__cell">
          <LoadingSpinner />
        </Table.Cell>
      );
    }

    const updateFailed = didUpdateFail(source, queuedStatus);
    // NOTE: updateFailed and queuedStatus will never both be true at the same time.
    const actionCellClassName = classNames('data-status-table__cell', {
      'data-status-table__queued-cell': queuedStatus,
      'data-status-table__update-data-cell': !queuedStatus && !updateFailed,
      'data-status-table__update-failed-cell': updateFailed,
    });

    return (
      <Table.Cell className={actionCellClassName}>
        <ActionCell
          actionCellRef={source}
          buildOnOpenModal={buildOnOpenModal}
          isSelfServeAdmin={isSelfServeAdmin}
          queuedStatus={queuedStatus}
          updateFailed={updateFailed}
        />
      </Table.Cell>
    );
  };

  const renderRow = source => {
    const {
      dataprepFlow,
      lastModified,
      latestFileSummary,
      pipelineDatasource,
      sourceId,
    } = source;
    // NOTE: The data upload table datetimes are stored in UTC, then converted here to
    // the local timezone to display.
    const sourceLastModified = Moment.utc(lastModified).local();
    // The graphQL query just fetches a single file summary with the latest last modified date.
    // The latest file summary should always be defined unless the database is in a bad state.
    // But since the foreign keys do not require the latest file summary be populated, falling
    // back to the source last modified guards against the bad state.
    const fileSummaryLastModified = Moment.utc(
      latestFileSummary.length > 0
        ? latestFileSummary[0].lastModified
        : lastModified,
    ).local();
    const queuedStatus = isSourceQueued(source, fileSummaryLastModified);
    const newIndicatorCount =
      pipelineDatasource.unpublishedFieldsCount.aggregate?.count || 0;

    return (
      <Table.Row className="data-status-table__row" id={sourceId}>
        <Table.Cell className="data-status-table__cell data-status-table__datasource-cell">
          {pipelineDatasource.name}
        </Table.Cell>
        <Table.Cell className="data-status-table__cell">
          {dataprepFlow ? I18N.text('Dataprep') : I18N.text('CSV')}
        </Table.Cell>
        <Table.Cell className="data-status-table__cell">
          {sourceLastModified.format(DATE_TIME_FORMAT)}
        </Table.Cell>
        <Table.Cell className="data-status-table__cell">
          {getDateRangeCell(sourceId, queuedStatus)}
        </Table.Cell>
        <Table.Cell className="data-status-table__cell">
          {getNewIndicatorCountCell(newIndicatorCount)}
        </Table.Cell>
        {renderActionCell(source, queuedStatus)}
      </Table.Row>
    );
  };

  return (
    <Table
      className="data-status-table"
      data={queryData.edges.map(edge => edge.node)}
      headers={HEADERS}
      initialColumnToSort="datasource"
      isHoverable={false}
      noDataText={I18N.text(
        'There are no data sources at this time.',
        'noSources',
      )}
      noResultsClassName="data-status-table__no-data-cell"
      renderRow={renderRow}
    />
  );
}
