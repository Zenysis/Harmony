// @flow
import * as React from 'react';
import { useLazyLoadQuery } from 'react-relay/hooks';

import ContainerHeader from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/ContainerHeader';
import DirectoryTable from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/DirectoryTable';
import FallbackDirectoryTableContainer from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/FallbackDirectoryTableContainer';
import type { DirectoryTableContainerQuery } from './__generated__/DirectoryTableContainerQuery.graphql';

type Props = {
  categoryId: string,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof DirectoryTable>,
    'hierarchyRoot',
  > | void,
  onCurrentCategoryChange: string => void,
};

const EMPTY_SET: $ReadOnlySet<string> = new Set();
const POLICY = { fetchPolicy: 'store-or-network' };

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

// Build the state of the checkbox based on how many rows are selected and how
// many rows can possibly be selected.
function buildSelectionState(
  totalSelected: number,
  totalRows: number,
): 'checked' | 'indeterminate' | 'unchecked' {
  if (totalSelected === 0) {
    return 'unchecked';
  }

  return totalSelected === totalRows ? 'checked' : 'indeterminate';
}

function DirectoryTableContainer({
  categoryId,
  hierarchyRoot,
  onCurrentCategoryChange,
}: Props) {
  const data = useLazyLoadQuery<DirectoryTableContainerQuery>(
    graphql`
      query DirectoryTableContainerQuery($id: ID!) {
        node(id: $id) {
          ... on category {
            children {
              id
            }

            fieldCategoryMappings: field_category_mappings {
              field {
                id
              }
            }
            ...DirectoryTable_category
          }
        }
      }
    `,
    { id: categoryId },
    POLICY,
  );

  const { children = [], fieldCategoryMappings = [] } = data.node || {};

  const allCategoryIds: $ReadOnlySet<string> = React.useMemo(
    () => new Set(children.map(({ id }) => id)),
    [children],
  );
  const allFieldIds: $ReadOnlySet<string> = React.useMemo(
    () => new Set(fieldCategoryMappings.map(({ field }) => field.id)),
    [fieldCategoryMappings],
  );

  // Track the category and field IDs that were bulk selected by the user.
  const [selectedCategories, setSelectedCategories] = React.useState(EMPTY_SET);
  const [selectedFields, setSelectedFields] = React.useState(EMPTY_SET);

  // Reset the current state if the data changes.
  React.useEffect(() => {
    setSelectedCategories(EMPTY_SET);
    setSelectedFields(EMPTY_SET);
  }, [data]);

  const onCategorySelect = React.useCallback(
    id => setSelectedCategories(updateSelectedItems(id, selectedCategories)),
    [selectedCategories],
  );

  const onFieldSelect = React.useCallback(
    id => setSelectedFields(updateSelectedItems(id, selectedFields)),
    [selectedFields],
  );

  const totalRows = allCategoryIds.size + allFieldIds.size;
  const totalSelected = selectedCategories.size + selectedFields.size;
  const selectionState = buildSelectionState(totalSelected, totalRows);

  const onSelectAllToggle = React.useCallback(() => {
    // If we are in the `unchecked` or `indeterminate` states when the user
    // clicks, we need to select all rows.
    if (selectionState === 'unchecked' || selectionState === 'indeterminate') {
      setSelectedCategories(allCategoryIds);
      setSelectedFields(allFieldIds);
    } else {
      setSelectedCategories(EMPTY_SET);
      setSelectedFields(EMPTY_SET);
    }
  }, [allCategoryIds, allFieldIds, selectionState]);

  if (hierarchyRoot === undefined) {
    throw new Promise(() => {});
  }

  return (
    <div className="dc-directory-table-container">
      <div className="dc-directory-table-container__header">
        <ContainerHeader
          categoryId={categoryId}
          hierarchyRoot={hierarchyRoot}
          itemCount={totalRows}
          selectedCategories={selectedCategories}
          selectedFields={selectedFields}
        />
      </div>
      <div
        className="dc-directory-table-container__directory-table"
        role="table"
      >
        <DirectoryTable
          categoryFragmentRef={data.node}
          hierarchyRoot={hierarchyRoot}
          onCategorySelect={onCategorySelect}
          onCurrentCategoryChange={onCurrentCategoryChange}
          onFieldSelect={onFieldSelect}
          onSelectAllToggle={onSelectAllToggle}
          parentCategoryId={categoryId}
          selectedCategories={selectedCategories}
          selectedFields={selectedFields}
          selectionState={selectionState}
        />
      </div>
    </div>
  );
}

export default (React.memo(
  DirectoryTableContainer,
): React.AbstractComponent<Props>);

export { FallbackDirectoryTableContainer };
