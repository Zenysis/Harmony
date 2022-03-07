// @flow
import * as React from 'react';
import { useMutation } from 'react-relay/hooks';

import BaseModal from 'components/ui/BaseModal';
import BatchPublishModalContents from 'components/FieldSetupApp/FieldSetupPageHeaderActions/BatchPublishAction/BatchPublishModalContents';
import I18N from 'lib/I18N';
import Toaster from 'components/ui/Toaster';
import { relayIdToDatabaseId } from 'util/graphql';

type Props = {
  onModalClose: () => void,
};

// BatchPublishModal component that also wraps its own mutation.
export default function BatchPublishModal({
  onModalClose,
}: Props): React.Element<typeof BaseModal> {
  const [publishableFieldEdges, setPublishableFieldEdges] = React.useState({});

  const [commit] = useMutation(
    graphql`
      mutation BatchPublishModalMutation(
        $fieldIds: [String!]!
        $fieldObjects: [field_insert_input!]!
      ) {
        insert_field(objects: $fieldObjects) {
          returning {
            id
            name
            short_name
            description
            calculation
            field_category_mappings {
              id
            }
            field_pipeline_datasource_mappings {
              id
            }
          }
        }

        delete_unpublished_field(where: { id: { _in: $fieldIds } }) {
          returning {
            id
          }
        }
      }
    `,
  );

  const onPublishClick = React.useCallback(() => {
    const fieldIds = [];
    const fieldObjects = publishableFieldEdges.publishableFields.edges.map(
      ({ node }) => {
        const {
          calculation,
          description,
          id,
          name,
          shortName,
          unpublishedFieldCategoryMappings,
          unpublishedFieldPipelineDatasourceMappings,
        } = node;

        fieldIds.push(id);

        const fieldCategoryMappings = unpublishedFieldCategoryMappings.map(
          mapping => ({
            category_id: mapping.categoryId,
          }),
        );
        const fieldPipelineDatasourceMappings = unpublishedFieldPipelineDatasourceMappings.map(
          mapping => ({
            pipeline_datasource_id: mapping.pipelineDatasourceId,
          }),
        );

        const dbId = relayIdToDatabaseId(id);

        return {
          calculation,
          description,
          field_category_mappings: { data: fieldCategoryMappings },
          field_pipeline_datasource_mappings: {
            data: fieldPipelineDatasourceMappings,
          },
          id: dbId,
          name,
          short_name: shortName,
        };
      },
    );

    const dbFieldIds = fieldIds.map(relayIdToDatabaseId);

    commit({
      onCompleted: () => {
        Toaster.success(I18N.text('Successfully published fields'));
        onModalClose();
      },
      onError: error => Toaster.error(error.message),
      updater: store => {
        fieldIds.forEach(id => {
          const record = store.get(id);
          if (record) {
            record.invalidateRecord();
          }
        });
      },
      variables: {
        fieldIds: dbFieldIds,
        fieldObjects,
      },
    });
  }, [commit, onModalClose, publishableFieldEdges]);

  return (
    <BaseModal
      onPrimaryAction={onPublishClick}
      onRequestClose={onModalClose}
      primaryButtonText={I18N.text('Publish Now')}
      show
      title={I18N.textById('Publish')}
      width={500}
    >
      <React.Suspense fallback="loading">
        <BatchPublishModalContents
          onPublishableFieldEdgesChange={setPublishableFieldEdges}
        />
      </React.Suspense>
    </BaseModal>
  );
}
