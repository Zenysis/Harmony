// @flow
import * as React from 'react';

import type DashboardTextItem from 'models/DashboardBuilderApp/DashboardItem/DashboardTextItem';

type Props = {
  item: DashboardTextItem,

  /**
   * An optional scaling factor that will enlarge or reduce the baseline text
   * height for the tile so that all the contents will be scaled to match.
   */
  scaleFactor?: number,
};

// This reference font size represents the desired font size if there was no
// scaling factor applied.
export const REFERENCE_FONT_SIZE = 16;

/**
 * The TextTile renders custom text content that the user has built inside the
 * tile.
 */
function TextTile({ item, scaleFactor = 1 }: Props) {
  // We want to scale each image in the tile by our scale factor
  const scaledHTML = React.useMemo(() => {
    // First we create a mock element in order to parse it to find the images
    const elt = document.createElement('html');
    elt.innerHTML = item.text();
    // Convert to an array so we can use a forEach loop
    const images = [...elt.getElementsByTagName('img')];

    // Once we've found the images, we then scale them by the scale factor.
    images.forEach(image => {
      const defaultWidth = parseInt(image.style.width, 10);
      const defaultHeight = parseInt(image.style.height, 10);
      // eslint-disable-next-line no-param-reassign
      image.style.width = `${defaultWidth * scaleFactor}px`;
      // eslint-disable-next-line no-param-reassign
      image.style.height = `${defaultHeight * scaleFactor}px`;
    });
    return elt.innerHTML;
  }, [scaleFactor, item]);

  return (
    <div
      className="gd-dashboard-text-tile"
      style={{ fontSize: REFERENCE_FONT_SIZE * scaleFactor }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: scaledHTML }}
    />
  );
}

export default (React.memo(TextTile): React.AbstractComponent<Props>);
