// @flow
import * as React from 'react';

import Group from 'components/ui/Group';

type Props = {
  scaleFactor: number,
};

/**
 * The DividerTile renders three dots (a dinkus) to provide visual separation.
 */
function DividerTile({ scaleFactor }: Props) {
  const diameter = `${4 * scaleFactor}px`;
  const dot = (
    <div
      className="gd-dashboard-divider_tile__divider-dot"
      style={{ height: diameter, width: diameter }}
    />
  );
  return (
    <Group
      ariaRole="separator"
      className="gd-dashboard-divider_tile"
      spacing="m"
    >
      {dot}
      {dot}
      {dot}
    </Group>
  );
}

export default (React.memo(DividerTile): React.AbstractComponent<Props>);
