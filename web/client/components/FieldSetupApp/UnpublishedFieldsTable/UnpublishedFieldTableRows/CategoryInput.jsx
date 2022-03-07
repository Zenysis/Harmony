// @flow
import * as React from 'react';
import { useFragment, useMutation } from 'react-relay/hooks';

import Button from 'components/ui/Button';
import Caret from 'components/ui/Caret';
import HierarchicalSelectorWrapper from 'components/DataCatalogApp/common/HierarchicalSelectorWrapper';
import I18N from 'lib/I18N';
import Popover from 'components/ui/Popover';
import useBoolean from 'lib/hooks/useBoolean';
import { relayIdToDatabaseId } from 'util/graphql';
import type { CategoryInput_unpublishedField$key } from './__generated__/CategoryInput_unpublishedField.graphql';

type Props = {
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof HierarchicalSelectorWrapper>,
    'hierarchyRoot',
  >,
  unpublishedFieldRef: CategoryInput_unpublishedField$key,
};

/** Uncontrolled component that manages category inputs and commits changes. */
export default function CategoryInput({
  hierarchyRoot,
  unpublishedFieldRef,
}: Props): React.Element<'div'> {
  const fieldData = useFragment(
    graphql`
      fragment CategoryInput_unpublishedField on unpublished_field {
        id
        unpublishedFieldCategoryMappings: unpublished_field_category_mappings {
          category {
            id
            name
          }
        }
      }
    `,
    unpublishedFieldRef,
  );

  // NOTE(yitian): We are currently only supporting fields mapping to one
  // category. We update mappings by first removing all old mappings associated
  // with the field and add our new mapping.
  const [commit] = useMutation(
    graphql`
      mutation CategoryInputMutation(
        $categoryId: String!
        $unpublishedFieldId: String!
      ) {
        delete_unpublished_field_category_mapping(
          where: { unpublished_field_id: { _eq: $unpublishedFieldId } }
        ) {
          returning {
            id
            unpublished_field_id
            category_id
          }
        }

        insert_unpublished_field_category_mapping_one(
          object: {
            unpublished_field_id: $unpublishedFieldId
            category_id: $categoryId
          }
        ) {
          id
          category {
            id
          }
          unpublished_field {
            id
            ...UnpublishedFieldRow_unpublishedField
          }
        }
      }
    `,
  );

  const selectorRef = React.useRef();
  const [isSelectorOpen, openSelector, closeSelector] = useBoolean(false);
  const [selectedItem, setSelectedItem] = React.useState(hierarchyRoot);

  const { id: fieldId, unpublishedFieldCategoryMappings } = fieldData;

  // Fields currently only map to 1 category so we are pulling out the first
  // mapping here.
  const currentCategoryId =
    unpublishedFieldCategoryMappings.length > 0
      ? unpublishedFieldCategoryMappings[0].category.id
      : undefined;

  const onApplyButtonClick = React.useCallback(() => {
    const newCategoryId = selectedItem.id();
    if (currentCategoryId !== newCategoryId) {
      commit({
        variables: {
          categoryId: relayIdToDatabaseId(newCategoryId),
          unpublishedFieldId: relayIdToDatabaseId(fieldId),
        },
      });
    }
    closeSelector();
  }, [closeSelector, commit, currentCategoryId, fieldId, selectedItem]);

  // Fields currently only map to 1 category so we are pulling out the first
  // mapping here.
  const displayName =
    unpublishedFieldCategoryMappings.length > 0
      ? unpublishedFieldCategoryMappings[0].category.name
      : I18N.textById('selectCategory');

  const testItemSelectable = React.useCallback(
    item => item.isCategoryItem(),
    [],
  );

  return (
    <div className="fs-category-input">
      <div ref={selectorRef}>
        <Button.Unstyled
          className="fs-category-input__main-button"
          onClick={openSelector}
        >
          {displayName}
          <Caret className="fs-category-input__caret" />
        </Button.Unstyled>
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
