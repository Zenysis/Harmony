// @flow
import * as React from 'react';
import classNames from 'classnames';
import { useLazyLoadQuery } from 'react-relay/hooks';

import BreadcrumbMenu from 'components/DataCatalogApp/DirectoryPage/BreadcrumbPath/BreadcrumbMenu';
import ChangeCategorySelector from 'components/DataCatalogApp/common/ChangeCategorySelector';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Popover from 'components/ui/Popover';
import Tooltip from 'components/ui/Tooltip';
import useBoolean from 'lib/hooks/useBoolean';
import useCategoryContentCount from 'components/DataCatalogApp/common/hooks/useCategoryContentCount';
import type { BreadcrumbLeafItemQuery } from './__generated__/BreadcrumbLeafItemQuery.graphql';

type Props = {
  categoryId: string,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof ChangeCategorySelector>,
    'hierarchyRoot',
  >,
  onCurrentCategoryChange: (id: string) => void,
};

const POLICY = { fetchPolicy: 'store-or-network' };
const ROOT_CATEGORY_NAME = I18N.textById('allResources');

// Directory table breadcrumb leaf item.
export default function BreadcrumbLeafItem({
  categoryId,
  hierarchyRoot,
  onCurrentCategoryChange,
}: Props): React.Element<'div' | typeof React.Fragment> {
  // NOTE(stephen): Preferring a standalone query here because this data will
  // likely already be in the cache. If it is not, then this query is very light
  // and should return quickly. Structural limitations around how the
  // DirectoryPage is rendered prevent us from being able to have the
  // DirectoryTable fetch this data (and therefore reduce the number of queries
  // needed).
  const data = useLazyLoadQuery<BreadcrumbLeafItemQuery>(
    graphql`
      query BreadcrumbLeafItemQuery($id: ID!) {
        node(id: $id) {
          ... on category {
            name
            parent {
              id
            }
            ...useCategoryContentCount_category
          }
        }
      }
    `,
    { id: categoryId },
    POLICY,
  );

  const categoryContentCount = useCategoryContentCount(data.node);
  const [showSelector, openSelector, closeSelector] = useBoolean(false);
  const [showMenu, openMenu, closeMenu] = useBoolean(false);
  const selectorRef = React.useRef();

  // HACK(yitian): We need to determine which button (left button or menu button)
  // the mouse is hovering over in order to determine the breadcrumb item styling.
  const [
    isMouseOverMenuButton,
    mouseOverMenuButton,
    mouseNotOverMenuButton,
  ] = useBoolean(false);
  const [
    isMouseOverLeftButton,
    mouseOverLeftButton,
    mouseNotOverLeftButton,
  ] = useBoolean(false);

  const breadcrumbItemClassName = classNames('dc-breadcrumb-leaf-item', {
    'dc-breadcrumb-leaf-item--left-hover':
      isMouseOverLeftButton && !showSelector,
    'dc-breadcrumb-leaf-item--left-open': showSelector,
    'dc-breadcrumb-leaf-item--right-hover': isMouseOverMenuButton && !showMenu,
    'dc-breadcrumb-leaf-item--right-open': showMenu,
  });

  const onCategoryChange = React.useCallback(
    id => {
      onCurrentCategoryChange(id);
      closeSelector();
      analytics.track('Click on leaf breadcrumb to navigate to new group');
    },
    [closeSelector, onCurrentCategoryChange],
  );

  const category = data.node || {};
  const isRootCategorySelected = categoryId === hierarchyRoot.id();

  // NOTE(stephen): Special case for the root category: we do not rely on the
  // name in the database since it is hardcoded and not user-facing. We instead
  // rely on the translated root name that we define on the frontend.
  const categoryName = isRootCategorySelected
    ? ROOT_CATEGORY_NAME
    : category.name || '';

  return (
    <div className={breadcrumbItemClassName}>
      <Tooltip
        content={categoryName}
        delayTooltip={500}
        targetClassName="dc-breadcrumb-leaf-item__tooltip-wrapper"
      >
        <div
          className="dc-breadcrumb-leaf-item__left-button"
          onClick={openSelector}
          onMouseEnter={mouseOverLeftButton}
          onMouseLeave={mouseNotOverLeftButton}
          ref={selectorRef}
          role="button"
        >
          <Heading.Large className="dc-breadcrumb-leaf-item__text">
            {categoryName}
          </Heading.Large>
        </div>
        <div
          className="dc-breadcrumb-leaf-item__breadcrumb-menu-wrapper"
          onMouseEnter={mouseOverMenuButton}
          onMouseLeave={mouseNotOverMenuButton}
        >
          <BreadcrumbMenu
            allowDeletion={
              !isRootCategorySelected && categoryContentCount === 0
            }
            categoryId={categoryId}
            categoryName={categoryName}
            hierarchyRoot={hierarchyRoot}
            onCurrentCategoryChange={onCurrentCategoryChange}
            onMenuClose={closeMenu}
            onMenuOpen={openMenu}
            parentCategoryId={category.parent ? category.parent.id : undefined}
          />
        </div>
      </Tooltip>
      <Popover
        anchorElt={selectorRef.current}
        anchorOrigin={Popover.Origins.BOTTOM_LEFT}
        containerType={Popover.Containers.NONE}
        doNotFlip
        isOpen={showSelector}
        keepInWindow
        offsetY={-8}
        onRequestClose={closeSelector}
        popoverOrigin={Popover.Origins.TOP_LEFT}
      >
        <ChangeCategorySelector
          allowCategoryReselection
          allowRootSelection
          applyButtonText={I18N.text('Navigate to folder')}
          hierarchyRoot={hierarchyRoot}
          id={categoryId}
          onCategoryChange={onCategoryChange}
        />
      </Popover>
    </div>
  );
}
