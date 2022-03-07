// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import useCanViewQueryForm from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TileMenu/QueryTileMenu/useCanViewQueryForm';
import type DashboardPlaceholderItem from 'models/DashboardBuilderApp/DashboardItem/DashboardPlaceholderItem';

type Props = {
  /**
   * The height of the tile. This is needed because the tile dynamically changes
   * its icon and background size based on the available space to render.
   */
  height: number,
  item: DashboardPlaceholderItem,

  /**
   * Callback when the button held in the tile is clicked. Usually, this will
   * trigger the edit tile flow for the actual concrete type held by this tile.
   */
  onButtonClick: () => void,

  /**
   * The width of the tile. This is needed because the tile dynamically changes
   * its icon and background size based on the available space to render.
   */
  width: number,
};

const BUTTON_TEXT = {
  iframe: I18N.text('Add iFrame'),
  query: I18N.textById('Add Visualization'),
  text_item: I18N.textById('Add Text'),
};

// Mapping from placeholder item type to the icon that represents that item.
export const PLACEHOLDER_ICON_MAP = {
  iframe: 'svg-iframe',
  query: 'svg-bar-line-visualization',
  text_item: 'svg-text',
};

const LARGE_BACKGROUND_SIZE = 184;
const LARGE_ICON_SIZE = 96;
const SMALL_BACKGROUND_SIZE = 64;
const SMALL_ICON_SIZE = 36;

// HACK(david): Have sizes of margin and button here in px. Feels fairly safe as
// our spacing variables and button are stable components.
const TILE_MARGIN = 24;
const BUTTON_ICON_SPACING = 16;
const BUTTON_HEIGHT = 35;

const MIN_LARGE_ICON_WIDTH = LARGE_BACKGROUND_SIZE + TILE_MARGIN * 2;
const MIN_LARGE_ICON_HEIGHT =
  MIN_LARGE_ICON_WIDTH + BUTTON_ICON_SPACING + BUTTON_HEIGHT;

// Placeholder content is arranged differently for small tile heights
const GROUP_HEIGHT_THRESHOLD = 120;
const ICON_HEIGHT_TRESHOLD = 96;

/**
 * The PlaceholderTile represents an unbuilt tile that the user can fill in.
 */
function PlaceholderTile({ height, item, onButtonClick, width }: Props) {
  const type = item.itemType();

  const showLargeIcon =
    width > MIN_LARGE_ICON_WIDTH && height > MIN_LARGE_ICON_HEIGHT;

  const backgroundSize = showLargeIcon
    ? LARGE_BACKGROUND_SIZE
    : SMALL_BACKGROUND_SIZE;
  const iconSize = showLargeIcon ? LARGE_ICON_SIZE : SMALL_ICON_SIZE;

  const backgroundStyle = {
    borderRadius: backgroundSize / 2,
    height: backgroundSize,
    width: backgroundSize,
  };

  const canViewQueryForm = useCanViewQueryForm();

  const showButton = canViewQueryForm || type !== 'query';
  const showIcon = height > ICON_HEIGHT_TRESHOLD;
  const contentDirection =
    height < GROUP_HEIGHT_THRESHOLD ? 'horizontal' : 'vertical';

  return (
    <div className="gd-dashboard-placeholder-tile">
      <Group
        alignItems="center"
        direction={contentDirection}
        flex
        margin="l"
        spacing="m"
      >
        {showIcon && (
          <div
            className="gd-dashboard-placeholder-tile__icon-circle-wrapper"
            style={backgroundStyle}
          >
            <Icon
              className="gd-dashboard-placeholder-tile__icon"
              style={{ height: iconSize, width: iconSize }}
              type={PLACEHOLDER_ICON_MAP[type]}
            />
          </div>
        )}
        {showButton && (
          <Button onClick={onButtonClick} outline>
            {BUTTON_TEXT[type]}
          </Button>
        )}
      </Group>
    </div>
  );
}

export default (React.memo(PlaceholderTile): React.AbstractComponent<Props>);
