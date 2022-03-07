// @flow
import * as React from 'react';

import FallbackPill from 'components/DataCatalogApp/common/FallbackPill';

type Props = {
  flex: number,
};

/**
 * The FallbackDirectoryRow renders a "loading" state that can be used in place
 * of a normal DirectoryRow. It occupies the same number of columns and is kept
 * in sync with the structure of the DirectoryRow.
 */
export default function FallbackDirectoryRow({
  flex,
}: Props): React.Element<'div'> {
  // NOTE(stephen): Right now we only render a fallback state for the directory
  // row's name column. All other columns are blank.
  return (
    <div>
      <div style={{ gridColumn: 2 }}>
        <FallbackPill height={24} width={24} />
        <FallbackPill height={14} style={{ marginLeft: 8, flex }} />
      </div>
    </div>
  );
}
