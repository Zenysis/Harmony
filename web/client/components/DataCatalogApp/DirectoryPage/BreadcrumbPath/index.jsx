// @flow
import * as React from 'react';
import classNames from 'classnames';
import { useLazyLoadQuery } from 'react-relay/hooks';

import BreadcrumbItem from 'components/DataCatalogApp/DirectoryPage/BreadcrumbPath/BreadcrumbItem';
import BreadcrumbLeafItem from 'components/DataCatalogApp/DirectoryPage/BreadcrumbPath/BreadcrumbLeafItem';
import Dropdown from 'components/ui/Dropdown';
import FallbackBreadcrumbPath from 'components/DataCatalogApp/DirectoryPage/BreadcrumbPath/FallbackBreadcrumbPath';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import IconButton from 'components/ui/IconButton';
import useBoolean from 'lib/hooks/useBoolean';
import useFilterHierarchy from 'components/DataCatalogApp/common/hooks/useFilterHierarchy';
import { noop } from 'util/util';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { BreadcrumbPathQuery } from './__generated__/BreadcrumbPathQuery.graphql';
import type { CategoryFilterItem } from 'models/DataCatalogApp/CategoryFilterTree';

type Props = {
  categoryId: string,
  onCurrentCategoryChange: (id: string) => void,
  onHierarchyRootChange: (HierarchyItem<CategoryFilterItem>) => void,
};

const POLICY = { fetchPolicy: 'store-or-network' };

const PATH_DIVIDER = (
  <Icon className="dc-breadcrumb-path__divider" type="chevron-right" />
);

const DROPDOWN_BUTTON_DISPLAY = (
  <IconButton
    className="dc-breadcrumb-path__collapse-icon-button"
    onClick={noop}
    type="svg-more-horiz"
  />
);

const ROOT_CATEGORY_NAME = I18N.text('All resources', 'allResources');

// Directory table bread crumb path component. When path contains more than 3
// elements, middle elements will be collapsed into a dropdown.
export default function BreadcrumbPath({
  categoryId,
  onCurrentCategoryChange,
  onHierarchyRootChange,
}: Props): React.Element<'div' | typeof BreadcrumbLeafItem> {
  // This query fetches the data needed for the filter hierarchy tree.
  // NOTE(stephen): It's really annoying that a hierarchy tree needs to be built
  // in two different ways: one using `useFilterHierarchy` and another using
  // `useFieldHierarchy` deep inside calculation creation. Figure out if this
  // can be consolidated.
  // TODO(stephen): If you register the query pieces used by the
  // CreateCalculationIndicatorView, relay is smart enough to not issue a new
  // query!
  const data = useLazyLoadQuery<BreadcrumbPathQuery>(
    graphql`
      query BreadcrumbPathQuery {
        categoryConnection: category_connection {
          ...useFilterHierarchy_categoryConnection
        }

        fieldConnection: field_connection {
          ...useFilterHierarchy_fieldConnection
        }
      }
    `,
    {},
    POLICY,
  );

  const [hierarchyRoot, getCategoryPath] = useFilterHierarchy(
    data.categoryConnection,
    data.fieldConnection,
  );

  // NOTE(stephen): The parent needs access to the hierarchy root. Instead of
  // building it in multiple places (and fetching the data twice), it seemed
  // cleaner to just push the hierarchy root to the parent when the reference
  // changes.
  React.useEffect(() => {
    onHierarchyRootChange(hierarchyRoot);
  }, [hierarchyRoot, onHierarchyRootChange]);

  // Get the parent categories, excluding the root and the leaf (the currently
  // selected category).
  const parentCategories = React.useMemo(
    () => getCategoryPath(categoryId).slice(1, -1),
    [categoryId, getCategoryPath],
  );

  const [isDropdownOpen, openDropdown, closeDropdown] = useBoolean(false);

  const rootId = hierarchyRoot.id();
  const isRootCategorySelected = categoryId === rootId;

  function renderMiddleCategorySection() {
    // If there is only one parent item, no middle section is needed.
    if (parentCategories.length === 1) {
      const parent = parentCategories[0];
      return (
        <BreadcrumbItem
          categoryId={parent.id}
          categoryName={parent.name()}
          onCurrentCategoryChange={onCurrentCategoryChange}
        />
      );
    }

    const buttonClassName = classNames('dc-breadcrumb-path__dropdown-button', {
      'dc-breadcrumb-path__dropdown-button--open': isDropdownOpen,
    });

    // Otherwise, we have too many items to render in the middle of the path and
    // must use a Dropdown instead.
    return (
      <Dropdown
        buttonClassName={buttonClassName}
        className="dc-breadcrumb-path__dropdown"
        defaultDisplayContent={DROPDOWN_BUTTON_DISPLAY}
        hideCaret
        onDropdownClose={closeDropdown}
        onOpenDropdownClick={openDropdown}
        onSelectionChange={onCurrentCategoryChange}
        value={undefined}
      >
        {parentCategories.map(item => (
          <Dropdown.Option key={item.id} value={item.id}>
            {item.name()}
          </Dropdown.Option>
        ))}
      </Dropdown>
    );
  }

  function maybeRenderParentCategoryPath() {
    // If we are at the root category, then there are no parents to render.
    if (isRootCategorySelected) {
      return null;
    }

    return (
      <div className="dc-breadcrumb-path__parent-items">
        <div className="dc-breadcrumb-path__root-item">
          <BreadcrumbItem
            categoryId={rootId}
            categoryName={ROOT_CATEGORY_NAME}
            onCurrentCategoryChange={onCurrentCategoryChange}
          />
        </div>
        {parentCategories.length > 0 && (
          <React.Fragment>
            {PATH_DIVIDER}
            {renderMiddleCategorySection()}
          </React.Fragment>
        )}
        {PATH_DIVIDER}
      </div>
    );
  }

  return (
    <div className="dc-breadcrumb-path">
      {maybeRenderParentCategoryPath()}
      <BreadcrumbLeafItem
        categoryId={categoryId}
        hierarchyRoot={hierarchyRoot}
        onCurrentCategoryChange={onCurrentCategoryChange}
      />
    </div>
  );
}

export { FallbackBreadcrumbPath };
