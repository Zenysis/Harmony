// @flow
import * as React from 'react';
import classNames from 'classnames';
import { useFragment, useMutation } from 'react-relay/hooks';

import Button from 'components/ui/Button';
import CalculationInput from 'components/FieldSetupApp/UnpublishedFieldsTable/UnpublishedFieldTableRows/CalculationInput';
import CategoryInput from 'components/FieldSetupApp/UnpublishedFieldsTable/UnpublishedFieldTableRows/CategoryInput';
import Checkbox from 'components/ui/Checkbox';
import DatasourceInput from 'components/FieldSetupApp/UnpublishedFieldsTable/UnpublishedFieldTableRows/DatasourceInput';
import DescriptionInput from 'components/FieldSetupApp/UnpublishedFieldsTable/UnpublishedFieldTableRows/DescriptionInput';
import Group from 'components/ui/Group';
import HierarchicalSelectorWrapper from 'components/DataCatalogApp/common/HierarchicalSelectorWrapper';
import I18N from 'lib/I18N';
import NameInput from 'components/FieldSetupApp/UnpublishedFieldsTable/UnpublishedFieldTableRows/NameInput';
import Popover from 'components/ui/Popover';
import ShortNameInput from 'components/FieldSetupApp/UnpublishedFieldsTable/UnpublishedFieldTableRows/ShortNameInput';
import Toaster from 'components/ui/Toaster';
import useBoolean from 'lib/hooks/useBoolean';
import { relayIdToDatabaseId } from 'util/graphql';
import type { UnpublishedFieldRow_pipelineDatasourceConnection$key } from './__generated__/UnpublishedFieldRow_pipelineDatasourceConnection.graphql';
import type { UnpublishedFieldRow_unpublishedField$key } from './__generated__/UnpublishedFieldRow_unpublishedField.graphql';

type Props = {
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof HierarchicalSelectorWrapper>,
    'hierarchyRoot',
  >,
  onSelectedFieldsChange: ($ReadOnlySet<string>) => void,
  pipelineDatasourceConnection: UnpublishedFieldRow_pipelineDatasourceConnection$key,
  selectedFieldIds: $ReadOnlySet<string>,
  unpublishedFieldRef: UnpublishedFieldRow_unpublishedField$key,
};

// Update the selected items to include the new item if it is not already
// present, or to remove the item if it is.
function updateSelectedItems(
  item: string,
  selectedItems: $ReadOnlySet<string>,
): $ReadOnlySet<string> {
  const newSelectedItems = new Set(selectedItems);

  // If the item already exists in the set, remove it.
  if (newSelectedItems.has(item)) {
    newSelectedItems.delete(item);
  } else {
    // If the item does *not* exist in the set, add it.
    newSelectedItems.add(item);
  }

  return newSelectedItems;
}

function UnpublishedFieldRow({
  hierarchyRoot,
  onSelectedFieldsChange,
  pipelineDatasourceConnection,
  selectedFieldIds,
  unpublishedFieldRef,
}: Props): React.Element<'div'> {
  const data = useFragment(
    graphql`
      fragment UnpublishedFieldRow_unpublishedField on unpublished_field {
        id
        name
        shortName: short_name
        description
        calculation
        unpublishedFieldCategoryMappings: unpublished_field_category_mappings {
          categoryId: category_id
        }
        unpublishedFieldPipelineDatasourceMappings: unpublished_field_pipeline_datasource_mappings {
          pipelineDatasourceId: pipeline_datasource_id
        }
        ...CalculationInput_unpublishedField
        ...CategoryInput_unpublishedField
        ...DatasourceInput_unpublishedField
        ...DescriptionInput_unpublishedField
        ...NameInput_unpublishedField
        ...ShortNameInput_unpublishedField
      }
    `,
    unpublishedFieldRef,
  );

  const datasources = useFragment(
    graphql`
      fragment UnpublishedFieldRow_pipelineDatasourceConnection on pipeline_datasourceConnection {
        ...DatasourceInput_pipelineDatasourceConnection
      }
    `,
    pipelineDatasourceConnection,
  );

  const [commit] = useMutation(
    graphql`
      mutation UnpublishedFieldRowMutation(
        $id: String!
        $name: String!
        $shortName: String!
        $description: String!
        $calculation: jsonb!
        $fieldCategoryMappings: [field_category_mapping_insert_input!]!
        $fieldPipelineDatasourceMappings: [field_pipeline_datasource_mapping_insert_input!]!
      ) {
        insert_field(
          objects: {
            id: $id
            name: $name
            short_name: $shortName
            description: $description
            calculation: $calculation
            field_category_mappings: { data: $fieldCategoryMappings }
            field_pipeline_datasource_mappings: {
              data: $fieldPipelineDatasourceMappings
            }
          }
        ) {
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

        delete_unpublished_field_by_pk(id: $id) {
          id
            @deleteEdge(
              connections: ["client:root:unpublished_field_connection"]
            )
        }
      }
    `,
  );

  const {
    calculation,
    description,
    id,
    name,
    shortName,
    unpublishedFieldCategoryMappings,
    unpublishedFieldPipelineDatasourceMappings,
  } = data;

  const dbId = relayIdToDatabaseId(id);

  const isChecked = selectedFieldIds.has(id);
  const onCheckboxSelect = React.useCallback(
    () => onSelectedFieldsChange(updateSelectedItems(id, selectedFieldIds)),
    [id, onSelectedFieldsChange, selectedFieldIds],
  );

  const requiredfieldsCompleted =
    name &&
    shortName &&
    calculation &&
    unpublishedFieldCategoryMappings.length > 0 &&
    unpublishedFieldPipelineDatasourceMappings.length > 0;

  const fieldRowClassName = classNames(
    'fs-unpublished-fields-table-rows__row',
    {
      'fs-unpublished-fields-table-rows__row--selected': isChecked,
    },
  );

  const onPublishClick = React.useCallback(() => {
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

    // Only commit changes if all fields are completed.
    if (requiredfieldsCompleted) {
      commit({
        onCompleted: () => {
          Toaster.success(
            I18N.text('Successfully published field %(name)s', { name }),
          );
        },
        onError: error => Toaster.error(error.message),
        updater: store => {
          const record = store.get(id);
          if (record) {
            record.invalidateRecord();
          }
        },
        variables: {
          calculation,
          description,
          fieldCategoryMappings,
          fieldPipelineDatasourceMappings,
          id: dbId,
          name,
          shortName,
        },
      });
    }
  }, [
    calculation,
    commit,
    dbId,
    description,
    id,
    name,
    requiredfieldsCompleted,
    shortName,
    unpublishedFieldCategoryMappings,
    unpublishedFieldPipelineDatasourceMappings,
  ]);

  const [anchorElt, setAnchorElt] = React.useState(null);
  const [showPopover, openPopover, closePopover] = useBoolean(false);

  const onMouseOver = React.useCallback(event => {
    setAnchorElt(event.currentTarget);
    openPopover();
  });

  return (
    <div className={fieldRowClassName} role="row">
      <div className="fs-field-row__id" role="cell">
        <Checkbox
          className="fs-field-row__checkbox"
          onChange={onCheckboxSelect}
          value={isChecked}
        />
        <Group.Vertical className="fs-field-row__id-block" flex>
          <span
            onBlur={closePopover}
            onFocus={onMouseOver}
            onMouseOut={closePopover}
            onMouseOver={onMouseOver}
          >
            <Group.Item className="fs-field-row__id-text">{dbId}</Group.Item>
          </span>
          {requiredfieldsCompleted && (
            <Button onClick={onPublishClick} size={Button.Sizes.SMALL}>
              <I18N>Publish</I18N>
            </Button>
          )}
        </Group.Vertical>
      </div>
      <div className="fs-field-row__name" role="cell">
        <NameInput unpublishedFieldRef={data} />
      </div>
      <div className="fs-field-row__short-name" role="cell">
        <ShortNameInput unpublishedFieldRef={data} />
      </div>
      <div className="fs-field-row__description" role="cell">
        <DescriptionInput unpublishedFieldRef={data} />
      </div>
      <div className="fs-field-row__calculation" role="cell">
        <CalculationInput unpublishedFieldRef={data} />
      </div>
      <div className="fs-field-row__category" role="cell">
        <CategoryInput
          hierarchyRoot={hierarchyRoot}
          unpublishedFieldRef={data}
        />
      </div>
      <div className="fs-field-row__datasource" role="cell">
        <DatasourceInput
          datasourceConnectionRef={datasources}
          unpublishedFieldRef={data}
        />
      </div>
      <Popover
        anchorElt={anchorElt}
        anchorOrigin={Popover.Origins.BOTTOM_LEFT}
        blurType={Popover.BlurTypes.DOCUMENT}
        className="fs-field-row__id-popover"
        isOpen={showPopover}
        popoverOrigin={Popover.Origins.TOP_LEFT}
      >
        {dbId}
      </Popover>
    </div>
  );
}

export default (React.memo(
  UnpublishedFieldRow,
): React.AbstractComponent<Props>);
