// @flow
import * as React from 'react';

import DirectoryTableHeader from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/DirectoryTable/DirectoryTableHeader';
import FallbackDirectoryRow from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/DirectoryTable/DirectoryRow/FallbackDirectoryRow';
import { noop } from 'util/util';
import { range } from 'util/arrayUtil';

type Props = {
  rows?: number,
};

// This constant defines a range of possible flex values to use when rendering
// the fallback directory rows. By varying the width of the fallback field name
// across multiple rows, we make the experience more realistic and full of life.
const ROW_FLEX = [0.8, 0.3, 0.6, 1, 0.4, 1, 0.4];

/**
 * The FallbackDirectoryTable component renders a placeholder DirectoryTable
 * that lines up directly with the full DirectoryTable. It renders placeholder
 * rows that indicate that the table is still loading.
 */
function FallbackDirectoryTableContainer({ rows = 5 }: Props) {
  return (
    <div className="dc-directory-table" role="table">
      <DirectoryTableHeader
        allowSelectAll={false}
        onSelectAllToggle={noop}
        selectionState="unchecked"
      />
      {range(rows).map(idx => (
        <FallbackDirectoryRow
          key={idx}
          flex={ROW_FLEX[idx % ROW_FLEX.length]}
        />
      ))}
    </div>
  );
}

export default (React.memo(
  FallbackDirectoryTableContainer,
): React.AbstractComponent<Props>);
