// @flow
import * as React from 'react';

import FallbackPill from 'components/ui/FallbackPill';
import Group from 'components/ui/Group';
import HeaderBlock from 'components/DataUploadApp/HeaderBlock';
import Table from 'components/ui/Table';
import { HEADERS } from 'components/DataUploadApp/SourceTable';

// This constant defines a range of possible flex values to use when rendering
// the fallback source rows. By varying the width of the fallback field name
// across multiple rows, we make the experience more realistic and full of life.
const ROW_FLEX = [0.8, 0.3, 0.6];

type Props = {
  isSelfServeAdmin: boolean,
};

export default function DataStatusPageFallback({
  isSelfServeAdmin,
}: Props): React.Node {
  const renderRow = flex => (
    <Table.Row id={flex}>
      <Table.Cell className="data-status-table__cell" colSpan={3}>
        <Group.Horizontal flex lastItemFlexValue={flex}>
          <FallbackPill height={35} width={35} />
          <FallbackPill height={20} />
        </Group.Horizontal>
      </Table.Cell>
    </Table.Row>
  );

  return (
    <div className="data-status-page min-full-page-height">
      <HeaderBlock isSelfServeAdmin={isSelfServeAdmin} loading />
      <Table
        className="data-status-table"
        data={ROW_FLEX}
        headers={HEADERS.map(({ sortFn, ...others }) => others)}
        renderRow={renderRow}
      />
    </div>
  );
}
