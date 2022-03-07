// @flow
import * as React from 'react';
import { useMutation } from 'react-relay/hooks';

import Button from 'components/ui/Button';
import HierarchicalSelectorWrapper from 'components/DataCatalogApp/common/HierarchicalSelectorWrapper';
import I18N from 'lib/I18N';
import Popover from 'components/ui/Popover';
import Toaster from 'components/ui/Toaster';
import useBoolean from 'lib/hooks/useBoolean';
import { relayIdToDatabaseId } from 'util/graphql';

type Props = {
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof HierarchicalSelectorWrapper>,
    'hierarchyRoot',
  >,
  selectedFieldIds: $ReadOnlySet<string>,
};

// Component that renders the field setup page batch update category button
// and action.
export default function UpdateCategoryAction({
  hierarchyRoot,
  selectedFieldIds,
}: Props): React.Element<'div'> {
  const [selectedItem, setSelectedItem] = React.useState(hierarchyRoot);
  const [isSelectorOpen, openSelector, closeSelector] = useBoolean(false);
  const selectorRef = React.useRef();

  // We are supporting fields mapping to only one category. Update mappings by
  // first removing all old mappings for all selected field ids. Then insert
  // new mappings with newly selected category id.
  const [commit] = useMutation(
    graphql`
      mutation UpdateCategoryActionMutation(
        $fieldCategoryMappingObjs: [unpublished_field_category_mapping_insert_input!]!
        $fieldIds: [String!]!
      ) {
        delete_unpublished_field_category_mapping(
          where: { unpublished_field_id: { _in: $fieldIds } }
        ) {
          returning {
            id
            unpublished_field_id
            category_id
          }
        }

        insert_unpublished_field_category_mapping(
          objects: $fieldCategoryMappingObjs
        ) {
          returning {
            id
            unpublished_field {
              id
              ...UnpublishedFieldRow_unpublishedField
            }
            category {
              id
            }
          }
        }
      }
    `,
  );

  const onApplyButtonClick = React.useCallback(() => {
    const dbFieldIds = Array.from(selectedFieldIds).map(fieldId =>
      relayIdToDatabaseId(fieldId),
    );
    const dbCategoryId = relayIdToDatabaseId(selectedItem.id());
    const fieldCategoryMappingObjs = dbFieldIds.map(fieldId => ({
      category_id: dbCategoryId,
      unpublished_field_id: fieldId,
    }));
    commit({
      onCompleted: () =>
        Toaster.success(I18N.text('Successfully updated categories!')),
      onError: error => Toaster.error(error.message),
      variables: {
        fieldCategoryMappingObjs,
        fieldIds: dbFieldIds,
      },
    });
    closeSelector();
  }, [closeSelector, commit, selectedFieldIds, selectedItem]);

  const testItemSelectable = React.useCallback(
    item => item.isCategoryItem(),
    [],
  );

  return (
    <div className="fs-update-category-action">
      <div ref={selectorRef}>
        <Button
          onClick={openSelector}
          outline={!isSelectorOpen}
          intent={Button.Intents.PRIMARY}
        >
          <I18N>Update Category</I18N>
        </Button>
      </div>
      <Popover
        anchorElt={selectorRef.current}
        anchorOrigin={Popover.Origins.BOTTOM_LEFT}
        containerType={Popover.Containers.NONE}
        doNotFlip
        isOpen={isSelectorOpen}
        keepInWindow
        onRequestClose={closeSelector}
        popoverOrigin={Popover.Origins.TOP_LEFT}
      >
        <HierarchicalSelectorWrapper
          hierarchyRoot={hierarchyRoot}
          onApplyButtonClick={onApplyButtonClick}
          onHierarchyPathTailChange={setSelectedItem}
          testItemSelectable={testItemSelectable}
        />
      </Popover>
    </div>
  );
}
