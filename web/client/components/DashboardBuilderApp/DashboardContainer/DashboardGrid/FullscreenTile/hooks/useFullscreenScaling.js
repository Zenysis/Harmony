// @flow
import * as React from 'react';

import useElementSize from 'lib/hooks/useElementSize';
import type { TilePosition } from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

/** A hook to provide scaling settings for the fullscreen tile mode */
export default function useFullscreenScaling(
  tilePosition: TilePosition,
  cellSize: number,
  tilePadding: number,
): [
  number, // referenceHeight
  number, // referenceWidth
  number, // scaleFactor
  $Ref<React.ElementRef<'div'>>, // tileContainerRef
] {
  // NOTE(stephen): Need to set a default non-zero height/width so that the
  // scaling calculations don't produce NaN by dividing by zero.
  const [
    { width: availableWidth, height: availableheight },
    tileContainerRef,
  ] = useElementSize({ height: 10, width: 10 });

  // First we calculate the height and width of the tile on the dashboard at
  // 100% zoom
  const originalTileHeight = tilePosition.rowCount * cellSize - tilePadding * 2;
  const originalTileWidth =
    tilePosition.columnCount * cellSize - tilePadding * 2;

  // We want to scale to fullscreen but at a potentially different aspect ratio
  // so we take the minimum scale factor of the two dimensions.
  const scaleFactor = Math.min(
    availableWidth / originalTileWidth,
    availableheight / originalTileHeight,
  );

  // Then we calculate the reference height as if the tile was drawn at the
  // fullscreen aspect ratio.
  const referenceWidth = availableWidth / scaleFactor;
  const referenceHeight = availableheight / scaleFactor;

  return [referenceHeight, referenceWidth, scaleFactor, tileContainerRef];
}
