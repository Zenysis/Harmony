// @flow
import * as React from 'react';
import { useMutation } from 'react-relay/hooks';

import DataUploadService from 'services/DataUploadService';
import FieldFilter from 'models/core/wip/QueryFilter/FieldFilter';
import I18N from 'lib/I18N';
import Moment from 'models/core/wip/DateTime/Moment';
import SumCalculation from 'models/core/wip/Calculation/SumCalculation';
import Toaster from 'components/ui/Toaster';
import { CSV_TYPE, DATAPREP_TYPE } from 'models/DataUploadApp/types';
import { relayIdToDatabaseNumberId } from 'util/graphql';
import type ZenHTTPError from 'util/ZenHTTPError';
import type { DataUploadModalState } from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import type { DataUploadSource } from 'components/DataUploadApp/SourceTable/ActionCell';
import type {
  data_upload_file_summary_insert_input as FileSummaryInsertInput,
  dataprep_flow_obj_rel_insert_input as DataprepFlowRelationInsertInput,
  pipeline_datasource_insert_input as PipelineDatasourceInsertInput,
  self_serve_source_insert_input as SelfServeSourceInsertInput,
  unpublished_field_pipeline_datasource_mapping_insert_input as UnpublishedFieldPipelineDatasourceMappingInsertInput,
  useSelfServeMutation as SourceMutationType,
} from './__generated__/useSelfServeMutation.graphql';

// NOTE: These are the pieces we need the server to return when a self serve source is
// updated. This will ensure that the cached values for the data upload table is updated in the
// relay store (cache). Include the `ActionCell_selfServeSource` fragment as well as the fields
// from `DataprepSetUp_pipelineDatasourceConnection` and `SourceTable_selfServeSource` that
// aren't in the fragment. Define this here so it can be reused in the insert and update mutations.
/* eslint-disable relay/unused-fields */
/* eslint-disable relay/must-colocate-fragment-spreads */
// eslint-disable-next-line no-unused-vars
const DATA_UPLOAD_TABLE_FRAGMENT = graphql`
  fragment useSelfServeMutation_DataUploadTableFragment on self_serve_source {
    pipelineDatasource: pipeline_datasource {
      id
      unpublishedFieldsCount: unpublished_field_pipeline_datasource_mappings_aggregate {
        aggregate {
          count
        }
      }
    }
    dataprepFlow: dataprep_flow {
      dataprepJobs: dataprep_jobs(limit: 1, order_by: { created: desc }) {
        lastModifiedOnDataprep: last_modified_on_dataprep
      }
    }
    lastModified: last_modified
    ...ActionCell_selfServeSource
  }
`;
/* eslint-enable relay/must-colocate-fragment-spreads */
/* eslint-enable relay/unused-fields */

// Creates or updates the self serve source object and all related objects. Finally,
// calls `updateCSVSource` for CSV sources to update the config and list of active
// sources in S3.
export default function useSelfServeMutation(
  initialSelfServeSource: DataUploadSource | void,
  fileSummariesToUnlink: $ReadOnlyArray<number>,
  dataUploadState: DataUploadModalState,
  refetchDataprepJobs: () => void,
): () => void {
  const [commit] = useMutation<SourceMutationType>(
    graphql`
      mutation useSelfServeMutation(
        $fileSummariesToUnlink: [Int!]!
        $insertNewSource: Boolean!
        $selfServeSource: self_serve_source_insert_input!
      ) {
        # Updates the 'data_upload_file_summary' table. For any previous file
        # summaries that have been replaced, we want to mantain the record in
        # the database, so we need to set their 'self_serve_source_id' to null.
        update_data_upload_file_summary(
          where: { id: { _in: $fileSummariesToUnlink } }
          _set: { self_serve_source_id: null }
        ) {
          returning
            @deleteEdge(
              connections: ["client:root:self_serve_source_connection"]
            ) {
            id
          }
        }

        # NOTE: There is a different block for the insert and update
        # changes to the self serve table. This is so the relay store is
        # updated correctly. Relay is not able to handle discerning whether
        # to update a record or create a new one, so it needed to be split
        # into two. These both are structured the exact same and take the
        # same '$selfServeSource' object so it is easier to mantain. They
        # both update the 'self_serve_source', 'data_upload_file_summary',
        # 'dataprep_flow', 'pipeline_datasource', 'unpublished_field', and
        # 'unpublished_field_pipeline_datasource_mapping' tables.

        # This is the insert block for new sources.
        # NOTE: This doesn't use 'insert_self_serve_source_one' since
        # that doesn't allow 'returning' to be defined so the cache isn't
        # updated correctly.
        insert_self_serve_source(objects: [$selfServeSource])
          @include(if: $insertNewSource) {
          returning
            @appendNode(
              connections: ["client:root:self_serve_source_connection"]
              edgeTypeName: "self_serve_sourceEdge"
            ) {
            ...useSelfServeMutation_DataUploadTableFragment
          }
        }

        # This is the update block for existing sources.
        # NOTE: This doesn't use 'update_self_serve_source' so
        # it can use the same '$selfServeSource' object as above.
        insert_self_serve_source(
          objects: [$selfServeSource]
          on_conflict: {
            constraint: self_serve_source_pkey
            update_columns: last_modified
          }
        ) @skip(if: $insertNewSource) {
          returning {
            ...useSelfServeMutation_DataUploadTableFragment
          }
        }
      }
    `,
  );

  return React.useCallback(() => {
    const {
      allowMultipleFiles,
      dataprepExpectedColumns,
      fileSummaries,
      recipeId,
      sourceId,
      sourceName,
      sourceType,
    } = dataUploadState;
    const insertNewSource = !initialSelfServeSource;
    const currentDatetime = Moment.utc();

    // Only use new or changed file summaries in the mutation in order to not change the file
    // summary last modified date unnecessarily.
    const fileSummaryIdToColumnMapping = {};
    initialSelfServeSource?.dataUploadFileSummaries.forEach(fileSummary => {
      fileSummaryIdToColumnMapping[relayIdToDatabaseNumberId(fileSummary.id)] =
        fileSummary.columnMapping;
    });

    const dataUploadFileSummaries: $ReadOnlyArray<FileSummaryInsertInput> = fileSummaries
      .values()
      .filter(
        fileSummary =>
          // New file summary
          !fileSummary.fileSummaryId ||
          // Column mapping has changed
          JSON.stringify(
            fileSummaryIdToColumnMapping[fileSummary.fileSummaryId],
          ) !==
            JSON.stringify(
              fileSummary.columnMapping
                .values()
                .map(columnSpec => columnSpec.serialize(sourceId)),
            ),
      )
      .map(fileSummary => {
        // For new dataprep sources, use the last modified date from the file summaries
        // since the dataprep source has already existed in the pipeline.
        const lastModified =
          insertNewSource && sourceType === DATAPREP_TYPE
            ? fileSummary.lastModified
            : currentDatetime;
        return {
          column_mapping: fileSummary.columnMapping
            .values()
            .map(columnSpec => columnSpec.serialize(sourceId)),
          created: lastModified,
          file_path: fileSummary.filePath,
          id: fileSummary.fileSummaryId,
          last_modified: lastModified,
          source_id: sourceId,
          user_file_name: fileSummary.userFileName,
        };
      });

    const dataprepFlow: ?DataprepFlowRelationInsertInput =
      sourceType === DATAPREP_TYPE
        ? {
            data: {
              appendable: allowMultipleFiles,
              expected_columns: dataprepExpectedColumns,
              recipe_id: recipeId,
            },
            // NOTE: If we ever allow a user to update the recipe id
            // in the front end, this should be revisited. Since we don't
            // currently keep track of the dataprep flow id, I put the
            // constraint on the recipe id (since we do track that). The
            // question in the future will be whether we want to update the
            // same dataprep flow record (in which case this code won't work)
            // or do we want to create a new record (in which case this code
            // is fine).
            on_conflict: {
              constraint: 'dataprep_flow_recipe_id_key',
              update_columns: ['appendable', 'expected_columns', 'recipe_id'],
            },
          }
        : null;

    // NOTE: columnSpec.match will never be null here because new fields
    // always have a match value. Update this once isNewColumn can refer to dimensions.
    const unpublishedFields: $ReadOnlyArray<UnpublishedFieldPipelineDatasourceMappingInsertInput> = fileSummaries
      .values()
      .map(fileSummary => fileSummary.columnMapping.values())
      .flat()
      .filter(
        columnSpec => columnSpec.isNewColumn() && !columnSpec.ignoreColumn(),
      )
      .map(columnSpec => columnSpec.serialize(sourceId))
      .map(columnSpec => ({
        unpublished_field: {
          data: {
            calculation: SumCalculation.create({
              filter: FieldFilter.create({ fieldId: columnSpec.match || '' }),
            }).serialize(),
            id: columnSpec.match,
            name: columnSpec.name,
            short_name: columnSpec.name,
          },
          on_conflict: {
            constraint: 'unpublished_field_pkey',
            update_columns: ['name', 'short_name'],
          },
        },
      }));

    const pipelineDatasource: PipelineDatasourceInsertInput = {
      id: sourceId,
      name: sourceName,
      unpublished_field_pipeline_datasource_mappings: {
        data: unpublishedFields,
        // This ensures that when the unpublished field is only updated,
        // graphql knows not to create new rows in the unpublished fields
        // to datasource mapping table.
        on_conflict: {
          constraint:
            'unpublished_field_pipeline_da_unpublished_field_id_pipeline_key',
          update_columns: [],
        },
      },
    };

    const selfServeSource: SelfServeSourceInsertInput = {
      data_upload_file_summaries: {
        data: dataUploadFileSummaries,
        // A new file should always creates a new file summary entry, so
        // only update column_mapping and last_modified on conflict.
        on_conflict: {
          constraint: 'data_upload_file_summary_pkey',
          update_columns: ['column_mapping', 'last_modified'],
        },
      },
      // Use the full object here so it can be null for CSV sources.
      dataprep_flow: dataprepFlow,
      last_modified: currentDatetime,
      pipeline_datasource: {
        data: pipelineDatasource,
        on_conflict: {
          constraint: 'pipeline_datasource_pkey',
          update_columns: ['name'],
        },
      },
    };
    if (initialSelfServeSource) {
      selfServeSource.id = relayIdToDatabaseNumberId(initialSelfServeSource.id);
    }

    const onError = error => {
      Toaster.error(
        insertNewSource
          ? I18N.text('Error creating new source')
          : I18N.text('Error updating source'),
      );
      console.error(error);
    };

    const onCompletedCSV = () => {
      DataUploadService.updateCSVSource(sourceId)
        .then(() => {
          const successText = insertNewSource
            ? I18N.text('Succesfully created new source')
            : I18N.text('Succesfully updated source');
          Toaster.success(successText);
        })
        .catch(onError);
    };

    const onCompletedDataprep = () => {
      // A new dataprep job only needs to be kicked off if the files have changed.
      if (
        !insertNewSource &&
        (dataUploadFileSummaries.length > 0 || fileSummariesToUnlink.length > 0)
      ) {
        const filesToUpload = dataUploadState.fileSummaries
          .values()
          .filter(fileSummary => !fileSummary.fileSummaryId)
          .map(fileSummary => ({
            filePath: fileSummary.filePath,
            userFileName: fileSummary.userFileName,
          }));
        const filesToDelete = (
          initialSelfServeSource?.dataUploadFileSummaries || []
        )
          .filter(fileSummary =>
            fileSummariesToUnlink.includes(
              relayIdToDatabaseNumberId(fileSummary.id),
            ),
          )
          .map(fileSummary => ({
            filePath: fileSummary.filePath,
            userFileName: fileSummary.userFileName,
          }));
        DataUploadService.uploadAndStartDataprepJob(
          sourceId,
          filesToUpload,
          filesToDelete,
        )
          .then(() => {
            refetchDataprepJobs();
            Toaster.success(
              I18N.text(
                'File(s) uploaded successfully. Dataprep job has been kicked off and output will be integrated',
              ),
            );
          })
          .catch((error: ZenHTTPError) => {
            // Bad requests that failed on starting the job still add entries to the
            // dataprep jobs table, so refetch.
            refetchDataprepJobs();
            if (error.isConflict()) {
              Toaster.error(
                I18N.text(
                  'The dataprep state is out of sync with Data Upload and the changes could not be made. Contact an Administrator for assistance.',
                ),
              );
            } else if (error.isNotFound()) {
              Toaster.error(
                I18N.text(
                  'There was a failure updating file(s) on dataprep. Contact an Administrator for assistance.',
                ),
              );
            } else if (error.isBadRequest()) {
              Toaster.error(
                I18N.text(
                  'There was a failure running the dataprep job. Details printed to the console. Contact an Administrator for assistance.',
                ),
              );
              console.error(error.message);
            } else {
              console.error(error);
              Toaster.error(
                I18N.text(
                  'An unknown error occurred. Contact an Administrator for assistance.',
                ),
              );
            }
          });
      } else if (insertNewSource) {
        Toaster.success(I18N.text('Succesfully created new dataprep source'));
      }
    };

    commit({
      onError,
      onCompleted: () => {
        // TODO: Figure out how failures here can rollback the mutation
        if (sourceType === CSV_TYPE) {
          onCompletedCSV();
        } else {
          onCompletedDataprep();
        }
      },
      variables: {
        fileSummariesToUnlink,
        insertNewSource,
        selfServeSource,
      },
    });
  }, [
    commit,
    dataUploadState,
    fileSummariesToUnlink,
    initialSelfServeSource,
    refetchDataprepJobs,
  ]);
}
