// @flow
import * as React from 'react';
import { useLazyLoadQuery } from 'react-relay/hooks';

import AddDataModal from 'components/DataUploadApp/AddDataModal';
import DataUploadService from 'services/DataUploadService';
import HeaderBlock from 'components/DataUploadApp/HeaderBlock';
import SourceTable from 'components/DataUploadApp/SourceTable';
import useBoolean from 'lib/hooks/useBoolean';
import useDimensionList from 'components/DataCatalogApp/common/hooks/aqt/useDimensionList';
import useFieldHierarchy from 'components/DataCatalogApp/common/hooks/aqt/useFieldHierarchy';
import useNoSuspenseRefetch from 'lib/hooks/useNoSuspenseRefetch';
import usePipelineTimes from 'components/DataUploadApp/usePipelineTimes';
import { DATAPREP_TYPE } from 'models/DataUploadApp/types';
import { buildDimensionHierarchy } from 'models/AdvancedQueryApp/QueryFormPanel/HierarchyTree';
import type { DataStatusPageSelfServeQuery } from './__generated__/DataStatusPageSelfServeQuery.graphql';
import type { DataUploadModalState } from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import type { DataUploadSource } from 'components/DataUploadApp/SourceTable/ActionCell';

type Props = {
  isSelfServeAdmin: boolean,
};

export default function DataStatusPage({
  isSelfServeAdmin,
}: Props): React.Node {
  const [modalVisible, showModal, hideModal] = useBoolean(false);
  const [
    initialSelfServeSource,
    setInitialSelfServeSource,
  ] = React.useState<DataUploadSource | void>(undefined);

  /* eslint-disable relay/must-colocate-fragment-spreads */
  const selfServeData = useLazyLoadQuery<DataStatusPageSelfServeQuery>(
    graphql`
      query DataStatusPageSelfServeQuery {
        selfServeSourceConnection: self_serve_source_connection {
          edges {
            node {
              sourceId: source_id
            }
          }
          ...SourceTable_selfServeSource
        }
        fieldConnection: field_connection {
          ...useFieldHierarchy_fieldConnection
        }
        categoryConnection: category_connection {
          ...useFieldHierarchy_categoryConnection
        }
        dimensionConnection: dimension_connection {
          ...useDimensionList_dimensionConnection
        }
        pipelineDatasourceConnection: pipeline_datasource_connection {
          ...DataprepSetUp_pipelineDatasourceConnection
        }
      }
    `,
    {},
  );
  /* eslint-enable relay/must-colocate-fragment-spreads */
  const existingSources = new Set(
    selfServeData.selfServeSourceConnection.edges.map(
      edge => edge.node.sourceId,
    ),
  );

  // NOTE: We're making use of how relay stores query references here.
  // The data from this query isn't actually "used" anywhere, but when it's
  // fetched, relay will update the other queries to point to this new data.
  // This query needs to fetch all of the dataprep_job fields that are in use.
  /* eslint-disable relay/unused-fields */
  const [isRefetching, refetchDataprepJobs] = useNoSuspenseRefetch(
    React.useMemo(
      () =>
        graphql`
          query DataStatusPageQuery {
            dataprep_flow_connection {
              edges {
                node {
                  dataprepJobs: dataprep_jobs(
                    limit: 1
                    order_by: { created: desc }
                  ) {
                    jobId: job_id
                    lastModifiedOnDataprep: last_modified_on_dataprep
                    status
                  }
                }
              }
            }
          }
        `,
      [],
    ),
  );
  /* eslint-enable relay/unused-fields */

  // Only use the first variable returned because we only need the hierarchy root.
  const fieldHierarchyRoot = useFieldHierarchy(
    selfServeData.categoryConnection,
    selfServeData.fieldConnection,
  )[0];
  const dimensionHierarchyRoot = buildDimensionHierarchy(
    useDimensionList(selfServeData.dimensionConnection),
  );

  const { lastPipelineRuntime, nextPipelineRuntime } = usePipelineTimes();

  const buildOnOpenModal = (
    source: DataUploadSource | void = undefined,
  ) => () => {
    setInitialSelfServeSource(source);
    showModal();
  };
  // Opening the modal from the header block creates a new source, so the source is undefined.
  const onOpenModal = buildOnOpenModal();

  // Sources that had files uploaded and then cancelled need to clean those files up.
  const onCloseModal = (dataUploadState: DataUploadModalState | void) => {
    if (dataUploadState) {
      const filesToUpload = dataUploadState.fileSummaries
        .values()
        .filter(fileSummary => !fileSummary.fileSummaryId)
        .map(fileSummary => fileSummary.filePath);

      if (filesToUpload) {
        DataUploadService.cleanFiles(
          dataUploadState.sourceId,
          dataUploadState.sourceType === DATAPREP_TYPE,
          filesToUpload,
        );
      }
    }
    hideModal();
  };

  return (
    <div className="data-status-page min-full-page-height">
      <HeaderBlock
        isSelfServeAdmin={isSelfServeAdmin}
        lastPipelineRuntime={lastPipelineRuntime}
        nextPipelineRuntime={nextPipelineRuntime}
        onOpenModal={onOpenModal}
      />
      <SourceTable
        buildOnOpenModal={buildOnOpenModal}
        isRefetching={isRefetching}
        isSelfServeAdmin={isSelfServeAdmin}
        lastPipelineRuntime={lastPipelineRuntime}
        refetchDataprepJobs={refetchDataprepJobs}
        sourceTableRef={selfServeData.selfServeSourceConnection}
      />
      {modalVisible && (
        <AddDataModal
          dimensionHierarchyRoot={dimensionHierarchyRoot}
          existingDataUploadSources={existingSources}
          fieldHierarchyRoot={fieldHierarchyRoot}
          initialSelfServeSource={initialSelfServeSource}
          onCloseModal={onCloseModal}
          pipelineDatasourceRef={selfServeData.pipelineDatasourceConnection}
          refetchDataprepJobs={refetchDataprepJobs}
        />
      )}
    </div>
  );
}
