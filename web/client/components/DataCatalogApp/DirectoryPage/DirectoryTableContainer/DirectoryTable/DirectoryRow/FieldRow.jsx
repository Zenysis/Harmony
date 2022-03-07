// @flow
import * as React from 'react';
import { useFragment, useMutation } from 'react-relay/hooks';

import DeleteFieldModal from 'components/DataCatalogApp/common/GroupActionModals/DeleteFieldModal';
import DirectoryRow from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/DirectoryTable/DirectoryRow';
import I18N from 'lib/I18N';
import useBoolean from 'lib/hooks/useBoolean';
import useFieldCalculation from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CalculationRow/useFieldCalculation';
import useParentCategoryChangeForFieldMutation from 'components/DataCatalogApp/DirectoryPage/hooks/ParentCategoryChange/useParentCategoryChangeForFieldMutation';
import { relayIdToDatabaseId } from 'util/graphql';
import type { FieldRowValueMutation } from './__generated__/FieldRowValueMutation.graphql';
import type { FieldRow_field$key } from './__generated__/FieldRow_field.graphql';
import type { FieldRow_fieldCategoryMapping$key } from './__generated__/FieldRow_fieldCategoryMapping.graphql';

type Props = {
  fieldCategoryMappingFragmentRef: FieldRow_fieldCategoryMapping$key,
  fieldFragmentRef: FieldRow_field$key,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof DirectoryRow>,
    'hierarchyRoot',
  >,
  onClick: (id: string, name: string) => void,
  onSelect: (id: string) => void,
  parentCategoryId: string,
  selected: boolean,
};

function FieldRow({
  fieldCategoryMappingFragmentRef,
  fieldFragmentRef,
  hierarchyRoot,
  onClick,
  onSelect,
  parentCategoryId,
  selected,
}: Props) {
  const data = useFragment(
    graphql`
      fragment FieldRow_field on field {
        id
        description
        name
        copiedFromFieldId: copied_from_field_id
        fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {
          pipelineDatasource: pipeline_datasource {
            id
            name
          }
        }
        ...useFieldCalculation_field
      }
    `,
    fieldFragmentRef,
  );
  const { visibilityStatus } = useFragment(
    graphql`
      fragment FieldRow_fieldCategoryMapping on field_category_mapping {
        visibilityStatus: visibility_status
      }
    `,
    fieldCategoryMappingFragmentRef,
  );
  const [
    deleteFieldModalOpen,
    onOpenDeleteFieldModal,
    onCloseDeleteFieldModal,
  ] = useBoolean(false);

  const { description, fieldPipelineDatasourceMappings, id, name } = data;
  const calculation = useFieldCalculation(data);

  const commitFieldCategoryChange = useParentCategoryChangeForFieldMutation();
  const [commitFieldValueChange] = useMutation<FieldRowValueMutation>(
    graphql`
      mutation FieldRowValueMutation(
        $categoryId: String!
        $dbId: String!
        $newDescription: String!
        $newName: String!
        $newVisibilityStatus: visibility_status_enum!
      ) {
        update_field_by_pk(
          pk_columns: { id: $dbId }
          _set: { description: $newDescription, name: $newName }
        ) {
          id
          description
          name
        }

        update_field_category_mapping(
          where: { field_id: { _eq: $dbId }, category_id: { _eq: $categoryId } }
          _set: { visibility_status: $newVisibilityStatus }
        ) {
          returning {
            visibility_status
            field_id
            category_id
          }
        }
      }
    `,
  );

  const onValueChange = React.useCallback(
    newValue => {
      commitFieldValueChange({
        variables: {
          categoryId: relayIdToDatabaseId(parentCategoryId),
          dbId: relayIdToDatabaseId(id),
          newDescription: newValue.description || '',
          newName: newValue.name,
          newVisibilityStatus: newValue.visibilityStatus,
        },
      });
      analytics.track('Edit field row in directory table');
    },
    [commitFieldValueChange, id, parentCategoryId],
  );

  const onCategoryChange = React.useCallback(
    (newParentCategoryId, onCompleted, onError) => {
      commitFieldCategoryChange({
        onCompleted,
        onError,
        variables: {
          fieldId: id,
          originalParentCategoryId: parentCategoryId,
          newParentCategoryId,
        },
      });
      analytics.track('Move item in directory', {
        type: 'indicator',
        location: 'row',
        multiselect: false,
      });
    },
    [commitFieldCategoryChange, id, parentCategoryId],
  );

  const onRowClick = React.useCallback(() => {
    analytics.track('Click on directory table indicator');
    onClick(id, name);
  }, [id, name, onClick]);
  const onRowSelect = React.useCallback(() => onSelect(id), [id, onSelect]);
  const dataSources = React.useMemo(
    () =>
      fieldPipelineDatasourceMappings.map(
        ({ pipelineDatasource }) => pipelineDatasource,
      ),
    [fieldPipelineDatasourceMappings],
  );

  const isCalculatedField =
    calculation.tag === 'FORMULA' || calculation.tag === 'COHORT';
  const deleteOptionTooltip = !isCalculatedField
    ? I18N.text(
        'Only Formula, Cohort, and Copied indicator types can be deleted. Instead, you can hide the indicator if you do not want users to see it.',
        'deleteFieldTooltip',
      )
    : undefined;

  const onDeleteFieldClick =
    isCalculatedField || data.copiedFromFieldId
      ? onOpenDeleteFieldModal
      : undefined;
  return (
    <>
      <DirectoryRow
        deleteOptionTooltip={deleteOptionTooltip}
        dataSources={dataSources}
        description={description || ''}
        hierarchyRoot={hierarchyRoot}
        id={id}
        name={name}
        onCategoryChange={onCategoryChange}
        onDeleteClick={onDeleteFieldClick}
        onClick={onRowClick}
        onSelect={onRowSelect}
        onValueChange={onValueChange}
        selected={selected}
        type="field"
        visibilityStatus={visibilityStatus}
      />
      <DeleteFieldModal
        id={id}
        name={name}
        onRequestClose={onCloseDeleteFieldModal}
        parentCategoryId={parentCategoryId}
        show={deleteFieldModalOpen}
      />
    </>
  );
}

export default (React.memo(FieldRow): React.AbstractComponent<Props>);
