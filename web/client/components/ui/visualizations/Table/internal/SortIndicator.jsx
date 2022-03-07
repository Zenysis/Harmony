// @flow
// NOTE(stephen): Direct copy from `react-virtualized`. This is needed since we
// are migrating away from their table implementation over to `react-window`.
import * as React from 'react';

import type { SortDirection } from 'components/ui/visualizations/Table/types';

type Props = {
  direction: SortDirection | void,
};

export default function SortIndicator({
  direction,
}: Props): React.Element<'svg'> {
  const ascending = direction === 'ASC';
  return (
    <svg
      className="ui-table-visualization-sort-indicator"
      height={18}
      viewBox="0 0 24 24"
      width={18}
    >
      {ascending && <path d="M7 14l5-5 5 5z" />}
      {!ascending && <path d="M7 10l5 5 5-5z" />}
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  );
}
