// @flow
import * as React from 'react';
import classNames from 'classnames';

import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Tooltip from 'components/ui/Tooltip';

// NOTE(stephen): Exporting this class so that we can easily reference it when
// configuring ReactGridLayout's drag settings.
export const TILE_DRAG_HANDLE_CLASS = 'gd-dashboard-tile-drag-button';

type Props = {
  legacy?: boolean,
  repositioningTiles: boolean,
};

/**
 * The TileDragButton is the portion of a dashboard tile that the user can drag
 * to reposition it along the grid. The `TILE_DRAG_HANDLE_CLASS` will be used by
 * ReactGridLayout to monitor for any drag events that happen inside the
 * dashboard without requiring individual handlers to be set everywhere.
 */
function TileDragButton({ repositioningTiles, legacy }: Props) {
  const targetClassName = classNames(TILE_DRAG_HANDLE_CLASS, {
    'gd-dashboard-tile-drag-button__legacy': legacy
  });
  return (
    <Tooltip
      content={I18N.text('Click and drag to move tile')}
      forceHideTooltip={repositioningTiles}
      targetClassName={targetClassName}
    >
      <Icon type="svg-drag-indicator" />
    </Tooltip>
  );
}

export default (React.memo(TileDragButton): React.AbstractComponent<Props>);
