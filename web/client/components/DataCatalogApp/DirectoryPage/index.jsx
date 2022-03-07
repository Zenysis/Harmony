// @flow
import * as React from 'react';

import BreadcrumbPath, {
  FallbackBreadcrumbPath,
} from 'components/DataCatalogApp/DirectoryPage/BreadcrumbPath';
import DirectoryTableContainer, {
  FallbackDirectoryTableContainer,
} from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer';
import { ROOT_CATEGORY_ID } from 'components/DataCatalogApp/constants';
import { getQueryParam } from 'util/util';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { CategoryFilterItem } from 'models/DataCatalogApp/CategoryFilterTree';

export default function DirectoryPage(): React.Node {
  // Pull the category ID from the URL. Only perform this action once when the
  // page is first loaded. After the page is loaded, the history state will
  // help us track changes to the category ID via the URL.
  const initialCategoryId = React.useMemo(() => {
    const id = getQueryParam('categoryId');
    return typeof id === 'string' ? decodeURIComponent(id) : ROOT_CATEGORY_ID;
  }, []);

  const [categoryId, setCategoryId] = React.useState<string>(initialCategoryId);
  const [
    hierarchyRoot,
    setHierarchyRoot,
  ] = React.useState<HierarchyItem<CategoryFilterItem> | void>(undefined);

  // NOTE(stephen): This is a rudimentary implementation of single-page-app
  // style support for the Directory page. When the user clicks on a category
  // row, the *history state* is changed. The user is not actually directed to
  // a new page. Instead, the history state is updated and the internal
  // selected category state is updated. When the user clicks the back button,
  // we are able to detect this and load the previously selected category ID.
  // This allows us to avoid refreshing the page and redownloading everything
  // each time the user makes an action.
  // TODO(stephen, yitian, solo): I (Stephen) have not actually verified all
  // possible edge cases of using the history APi, so there might be annoying
  // subtle bugs. This is just a sample implementation so we can get a good
  // feel for the DirectoryPage.
  // TODO(stephen, yitian, solo): Figure out what to do when an invalid category
  // ID is specified in the URL.

  // Initialize the category ID for this page's history state. This will allow
  // us to return to this page (via the back button) and know which categoryId
  // was selected at the time. This is only needed when the page is first loaded
  // since the history state will be null.
  React.useEffect(() => {
    window.history.replaceState({ categoryId: initialCategoryId }, '');

    // When a `popstate` event happens (i.e. the user navigates pages using the
    // forwards or backwards buttons in the browser), we want to update our
    // current category ID to be whatever the ID was for that page.
    const listener = event => {
      if (event.state && 'categoryId' in event.state) {
        setCategoryId(event.state.categoryId);
      }
    };
    window.addEventListener('popstate', listener);

    return () => window.removeEventListener('popstate', listener);
  }, [initialCategoryId]);

  // When the user clicks on a category, make it look like the user is
  // navigating to a new page. Behind the scenes, we will update the history
  // API to avoid having to reload any JS.
  const onCurrentCategoryChange = React.useCallback(newCategoryId => {
    const basePath = window.location.pathname;
    const newURL =
      newCategoryId !== ROOT_CATEGORY_ID
        ? `${basePath}?categoryId=${encodeURIComponent(newCategoryId)}`
        : basePath;

    window.history.pushState({ categoryId: newCategoryId }, '', newURL);
    setCategoryId(newCategoryId);
  }, []);

  return (
    <div className="dc-directory-page">
      <div className="dc-directory-page__breadcrumb-section">
        <React.Suspense fallback={<FallbackBreadcrumbPath />}>
          <BreadcrumbPath
            categoryId={categoryId}
            onCurrentCategoryChange={onCurrentCategoryChange}
            onHierarchyRootChange={setHierarchyRoot}
          />
        </React.Suspense>
      </div>
      <div className="dc-directory-page__table-section">
        <React.Suspense fallback={<FallbackDirectoryTableContainer />}>
          <DirectoryTableContainer
            categoryId={categoryId}
            hierarchyRoot={hierarchyRoot}
            onCurrentCategoryChange={onCurrentCategoryChange}
          />
        </React.Suspense>
      </div>
    </div>
  );
}
