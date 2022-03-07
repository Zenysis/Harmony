// @flow
import invariant from 'invariant';

import { REFERENCE_FONT_SIZE } from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TextTile';
import type DashboardTextItem from 'models/DashboardBuilderApp/DashboardItem/DashboardTextItem';

/**
 * To measure the height of a text tile we render it in a hidden div with the
 * same styling that will be applied to the tile.
 */
export default function measureTextTileHeight(
  item: DashboardTextItem,
  width: number,
): number {
  const appRoot = document.getElementById('app');
  invariant(appRoot, 'The app root should always exists');

  // First we create a mock tile container element
  const tileContainer = document.createElement('div');
  tileContainer.style.visibility = 'hidden';
  tileContainer.style.width = `${width}px`;

  // Then we create a mock text tile
  const textTile = document.createElement('div');
  textTile.innerHTML = item.text();
  textTile.className = 'gd-dashboard-text-tile';
  textTile.style.fontSize = `${REFERENCE_FONT_SIZE}px`;

  // Then we add both to the DOM and measure the height
  tileContainer.appendChild(textTile);
  appRoot.appendChild(tileContainer);
  const height = tileContainer.offsetHeight;

  // TODO(david): Don't remove these elements, instead we could re-use the
  // existing div from previosu measurements.
  // Finally, we clean up the elements that we added to the DOM.
  tileContainer.removeChild(textTile);
  appRoot.removeChild(tileContainer);

  return height;
}
