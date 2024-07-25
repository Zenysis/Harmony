// @flow
import * as React from 'react';
import { useMutation } from 'react-relay/hooks';

import DataUploadService from 'services/DataUploadService';
import I18N from 'lib/I18N';
import Toaster from 'components/ui/Toaster';
import type { useDeleteSourceMutation as DeleteSourceMutationType } from './__generated__/useDeleteSourceMutation.graphql';

// Delete a self serve object and any associated data upload file summary, dataprep flow, and
// dataprep job objects. Then, call `deleteSource` to update the list of active sources in S3.
export default function useDeleteSourceMutation(): (
  selfServeSourceId: number,
  sourceId: string,
  dataprepFlowId: number | void,
) => void {
  const [commit] = useMutation<DeleteSourceMutationType>(
    graphql`
      mutation useDeleteSourceMutation(
        $selfServeSourceId: Int!
        $sourceId: String!
        $isDataprep: Boolean!
        $dataprepFlowId: Int!
      ) {
        delete_self_serve_source_by_pk(id: $selfServeSourceId) {
          id
            @deleteEdge(
              connections: ["client:root:self_serve_source_connection"]
            )
        }

        # Delete all data upload file summary records connected to this source
        delete_data_upload_file_summary(
          where: { source_id: { _eq: $sourceId } }
        ) {
          returning {
            id
          }
        }

        # If it's a dataprep source, delete all dataprep job records connected to this source
        delete_dataprep_job(
          where: { dataprep_flow_id: { _eq: $dataprepFlowId } }
        ) @include(if: $isDataprep) {
          returning {
            id
          }
        }

        # If it's a dataprep source, delete the dataprep flow connected to this source
        delete_dataprep_flow_by_pk(id: $dataprepFlowId)
          @include(if: $isDataprep) {
          id
        }
      }
    `,
  );

  return React.useCallback(
    (
      selfServeSourceId: number,
      sourceId: string,
      dataprepFlowId: number | void,
    ) => {
      const onError = error => {
        Toaster.error(I18N.text('Error deleting source'));
        console.error(error);
      };

      commit({
        onError,
        onCompleted: () => {
          DataUploadService.deleteSource(sourceId).catch(onError);
        },
        variables: {
          selfServeSourceId,
          sourceId,
          // NOTE: Relay requires a number type even if it won't be used.
          dataprepFlowId: dataprepFlowId || 0,
          isDataprep: !!dataprepFlowId,
        },
      });
    },
    [commit],
  );
}
