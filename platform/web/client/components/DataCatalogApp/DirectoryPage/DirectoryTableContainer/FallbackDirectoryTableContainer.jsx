// @flow
import * as React from 'react';

import ContainerHeader from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/ContainerHeader';
import FallbackDirectoryTable from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/DirectoryTable/FallbackDirectoryTable';

const EMPTY_SET = new Set();

/**
 * The FallbackDirectoryTableContainer renders a "loading" state for the
 * DirectoryTableContainer, including a version of the container header and
 * directory table that indicate that the data is still being loaded.
 */
function FallbackDirectoryTableContainer() {
  return (
    <div className="dc-directory-table-container">
      <div className="dc-directory-table-container__header">
        <ContainerHeader
          categoryId=""
          hierarchyRoot={undefined}
          itemCount={0}
          selectedCategories={EMPTY_SET}
          selectedFields={EMPTY_SET}
        />
      </div>
      <div
        className="dc-directory-table-container__directory-table"
        role="table"
      >
        <FallbackDirectoryTable />
      </div>
    </div>
  );
}

export default (React.memo(
  FallbackDirectoryTableContainer,
): React.AbstractComponent<{}>);
