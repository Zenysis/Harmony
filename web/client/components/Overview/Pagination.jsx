// @flow
// This component wraps our generic PageSelector so that it can be used inside
// react-table.
// NOTE(stephen): Might be useful making this common if other users of
// react-table outside the Overview page want to use it.
import * as React from 'react';

import PageSelector from 'components/ui/PageSelector';

type Props = {
  onPageChange: number => void,
  page: number,
  pageSize: number,
  sortedData: $ReadOnlyArray<mixed>,
};

export default function Pagination({
  onPageChange,
  page,
  pageSize,
  sortedData,
}: Props) {
  // PageSelector page numbering is one indexed, while react-table is zero
  // indexed.
  return (
    <PageSelector
      className="overview-table-pagination"
      currentPage={page + 1}
      onPageChange={newPage => onPageChange(newPage - 1)}
      pageSize={pageSize}
      resultCount={sortedData.length}
    />
  );
}
