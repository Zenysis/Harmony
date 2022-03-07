// @flow
import * as React from 'react';

import BreadcrumbItem from 'components/ui/Breadcrumb/BreadcrumbItem';
import BreadcrumbItemWrapper from 'components/ui/Breadcrumb/BreadcrumbItemWrapper';
import Icon from 'components/ui/Icon';
import RecursiveCategoryBreadcrumb from 'components/DataCatalogApp/common/CategoryPath/RecursiveCategoryBreadcrumb';

type Props = {
  id: string | void,

  className?: string,

  // The maximum number of category breadcrumbs to display.
  maxDepth?: number | void,
};

const HOME_BREADCRUMB = (
  <BreadcrumbItemWrapper className="category-path__breadcrumb-item">
    <BreadcrumbItem value="home">
      <Icon type="home" />
    </BreadcrumbItem>
  </BreadcrumbItemWrapper>
);

// Display the category name and all parent categories in a breadcrumb.
// NOTE(stephen): This component does not actually render a `Breadcrumb` ui
// component because that component has a strict limitation on the type of
// children that can be passed. Instead, the same CSS is applied through the
// class name and the individual items are rendered instead.
function CategoryPath({ id, className = '', maxDepth = undefined }: Props) {
  return (
    <div className={`category-path ${className}`}>
      {HOME_BREADCRUMB}
      {id !== undefined && (
        <RecursiveCategoryBreadcrumb id={id} maxDepth={maxDepth} />
      )}
    </div>
  );
}

export default (React.memo<Props>(
  CategoryPath,
): React.AbstractComponent<Props>);
