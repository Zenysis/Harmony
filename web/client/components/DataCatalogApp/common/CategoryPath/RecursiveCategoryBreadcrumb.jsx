// @flow
import * as React from 'react';
import { useLazyLoadQuery } from 'react-relay/hooks';

import BreadcrumbItem from 'components/ui/Breadcrumb/BreadcrumbItem';
import BreadcrumbItemWrapper from 'components/ui/Breadcrumb/BreadcrumbItemWrapper';
import { ROOT_CATEGORY_ID } from 'components/DataCatalogApp/constants';
import type { RecursiveCategoryBreadcrumbQuery } from './__generated__/RecursiveCategoryBreadcrumbQuery.graphql';

type Props = {
  id: string,

  // Since this component is recursive, we include a maximum depth prop as an
  // infinite recursion escape hatch. It can also be used if you only want to
  // display a smaller number of breadcrumbs than what is
  maxDepth?: number,
};

const POLICY = { fetchPolicy: 'store-or-network' };

const PLACEHOLDER_BREADCRUMB = (
  <BreadcrumbItemWrapper className="category-path__breadcrumb-item">
    <BreadcrumbItem value="placeholder">...</BreadcrumbItem>
  </BreadcrumbItemWrapper>
);

// Display the category name and all parent categories in a breadcrumb.
// NOTE(stephen): This component is different from most components in the
// codebase. It is a *recursive* component. It also requires a graphql query
// and does not rely on a fragment. The way that categories are structured in
// the database, each category has a potential mapping to a parent category. We
// cannot issue a recursive graphql query to get the full hierarchy at once, and
// we don't want to query for every single category that exists just so we can
// build the hierarchy for one of them. Instead, we query for one category and
// its parent, and then we recursively render this component again passing the
// parent category ID as the prop. This continues until we reach the root
// category. We are able to do this with zero network requests most of the time
// because the full mapping of categories is often already loaded by another
// query on the site (like the Field HierarchicalSelector). Since Relay has
// globally unique IDs, when this component queries for data that already exists
// in the store, we just receive the cached result. In the case that the cache
// has not been populated with all categories, we will issue a network request
// for each item. Since this is a rare occurrence and the network requests are
// very light, we are ok with this tradeoff for the simplicity of code.
// NOTE(stephen): This component renders `BreadcrumbItemWrapper`s directly
// instead of `BreadcrumbItem`s since the `Breadcrumb` component requires strict
// usage where the children are an array of `BreadcrumbItem`s.
function RecursiveCategoryBreadcrumb({ id, maxDepth = 50 }: Props) {
  const data = useLazyLoadQuery<RecursiveCategoryBreadcrumbQuery>(
    graphql`
      query RecursiveCategoryBreadcrumbQuery($id: ID!) {
        node(id: $id) {
          ... on category {
            name
            parent {
              id
            }
          }
        }
      }
    `,
    { id },
    POLICY,
  );

  if (!data.node) {
    return null;
  }

  // Update the max depth. Each time this component renders recursively, the
  // max depth will be decremented.
  const newMaxDepth = maxDepth - 1;
  const { name = '', parent = undefined } = data.node;

  // Test to see if we have reached the maximum number of path segments to
  // render. If we have not, then we can continue rendering the next parent
  // category if it exists.
  const parentId = parent ? parent.id : undefined;

  // When we have reached the root, we want to render the Home breadcrumb item
  // to signify there are no parents left.
  const reachedRoot = parentId === ROOT_CATEGORY_ID || parentId === undefined;

  // If we have hit the maximum depth and still have a parent for this category,
  // we render a placeholder breadcrumb to signify that there are more parents
  // remaining that cannot be displayed.
  const hitMaxDepthBeforeRoot = newMaxDepth <= 0 && !reachedRoot;
  return (
    <React.Suspense fallback={PLACEHOLDER_BREADCRUMB}>
      {hitMaxDepthBeforeRoot && PLACEHOLDER_BREADCRUMB}
      {newMaxDepth > 0 && !reachedRoot && parentId !== undefined && (
        <RecursiveCategoryBreadcrumb id={parentId} maxDepth={newMaxDepth} />
      )}
      <BreadcrumbItemWrapper className="category-path__breadcrumb-item">
        <BreadcrumbItem value={name}>{name}</BreadcrumbItem>
      </BreadcrumbItemWrapper>
    </React.Suspense>
  );
}

export default (React.memo<Props>(
  RecursiveCategoryBreadcrumb,
): React.AbstractComponent<Props>);
