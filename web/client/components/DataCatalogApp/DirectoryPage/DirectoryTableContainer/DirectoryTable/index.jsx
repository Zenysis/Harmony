// @flow
import * as React from 'react';
import classNames from 'classnames';
import { useFragment } from 'react-relay/hooks';

import CategoryGroupRow from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/DirectoryTable/DirectoryRow/CategoryGroupRow';
import DirectoryTableHeader from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/DirectoryTable/DirectoryTableHeader';
import EmptyTableBanner from 'components/common/EmptyTableBanner';
import FieldRow from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/DirectoryTable/DirectoryRow/FieldRow';
import I18N from 'lib/I18N';
import buildFieldDetailsPageLink from 'components/DataCatalogApp/buildFieldDetailsPageLink';
import { onLinkClicked } from 'util/util';
import type { DirectoryTable_category$key } from './__generated__/DirectoryTable_category.graphql';

type Props = {
  categoryFragmentRef: ?DirectoryTable_category$key,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof CategoryGroupRow>,
    'hierarchyRoot',
  >,
  onCategorySelect: string => void,
  onCurrentCategoryChange: string => void,
  onFieldSelect: string => void,
  onSelectAllToggle: () => void,
  parentCategoryId: string,
  selectedCategories: $ReadOnlySet<string>,
  selectedFields: $ReadOnlySet<string>,
  selectionState: 'checked' | 'indeterminate' | 'unchecked',
};

const onFieldClick = (fieldId: string, fieldName: string) => {
  const url = buildFieldDetailsPageLink(fieldId, fieldName);
  onLinkClicked(url);
};

/**
 * The DirectoryTable component renders all category and field rows for a given
 * parent category.
 */
function DirectoryTable({
  categoryFragmentRef,
  hierarchyRoot,
  onCategorySelect,
  onCurrentCategoryChange,
  onFieldSelect,
  onSelectAllToggle,
  parentCategoryId,
  selectedCategories,
  selectedFields,
  selectionState,
}: Props) {
  const category = useFragment(
    graphql`
      fragment DirectoryTable_category on category {
        children {
          id
          name
          ...CategoryGroupRow_category
        }

        fieldCategoryMappings: field_category_mappings {
          field {
            id
            name
            ...FieldRow_field
          }
          ...FieldRow_fieldCategoryMapping
        }
      }
    `,
    categoryFragmentRef,
  );

  const { children = [], fieldCategoryMappings = [] } = category || {};

  // Ensure categories and fields are always in alphabetical order.
  // NOTE(stephen): We can't add this sort property to the graphql query,
  // unfortunately, since it makes relay store updates more difficult.
  const categories = React.useMemo(
    () => children.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [children],
  );
  const sortedFieldCategoryMappings = React.useMemo(
    () =>
      Array.from(fieldCategoryMappings).sort((a, b) =>
        a.field.name.localeCompare(b.field.name),
      ),
    [fieldCategoryMappings],
  );

  const className = classNames('dc-directory-table', {
    'dc-directory-table--has-selected-rows': selectionState !== 'unchecked',
  });

  const totalRows = categories.length + sortedFieldCategoryMappings.length;
  return (
    <div className={className} role="table">
      <DirectoryTableHeader
        allowSelectAll={totalRows > 0}
        onSelectAllToggle={onSelectAllToggle}
        selectionState={selectionState}
      />
      {categories.map(child => (
        <CategoryGroupRow
          categoryFragmentRef={child}
          hierarchyRoot={hierarchyRoot}
          key={child.id}
          onClick={onCurrentCategoryChange}
          onSelect={onCategorySelect}
          parentCategoryId={parentCategoryId}
          selected={selectedCategories.has(child.id)}
        />
      ))}
      {sortedFieldCategoryMappings.map(fieldCategoryMapping => (
        <FieldRow
          fieldCategoryMappingFragmentRef={fieldCategoryMapping}
          fieldFragmentRef={fieldCategoryMapping.field}
          hierarchyRoot={hierarchyRoot}
          key={fieldCategoryMapping.field.id}
          onClick={onFieldClick}
          onSelect={onFieldSelect}
          parentCategoryId={parentCategoryId}
          selected={selectedFields.has(fieldCategoryMapping.field.id)}
        />
      ))}
      <EmptyTableBanner
        show={totalRows === 0}
        title={I18N.text('No resources found')}
        subTitle={I18N.text('There are no resources in this folder')}
      />
    </div>
  );
}

export default (React.memo(DirectoryTable): React.AbstractComponent<Props>);
