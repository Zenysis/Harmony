// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import ElementResizeService from 'services/ui/ElementResizeService';
import {
  getDateFilterValue,
  DATE_FILTER_REGEX,
  DATE_FILTER_REPLACE_REGEX,
} from 'util/util';
import type DashboardTextItem from 'models/DashboardBuilderApp/DashboardItem/DashboardTextItem';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  /**
   * extracted filters to apply to the display custom values in
   * the text box
   */
  extractedFilterItems: $ReadOnlyArray<QueryFilterItem>,

  item: DashboardTextItem,
  onHeightUpdate: (rowCount: number) => void,
  onItemChange: DashboardTextItem => void,
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
function TextTile({
  extractedFilterItems,
  item,
  onHeightUpdate,
  onItemChange,
  scaleFactor = 1,
}: Props) {
  const itemsZenArray = React.useMemo(
    () => Zen.Array.create(extractedFilterItems),
    [extractedFilterItems],
  );
  const dateFilterValue = getDateFilterValue(itemsZenArray);
  const prevTileContent = React.useRef(item.text());
  const tileContent = React.useMemo(() => {
    return item
      .text()
      .replace(DATE_FILTER_REGEX, dateFilterValue)
      .replace(DATE_FILTER_REPLACE_REGEX, dateFilterValue);
  }, [item, dateFilterValue]);

  const onUpdateTileContent = React.useCallback(
    (newTileContent: string) => {
      onItemChange(item.text(newTileContent));
    },
    [item, onItemChange],
  );

  React.useEffect(() => {
    if (prevTileContent.current === tileContent) return;

    prevTileContent.current = tileContent;
    onUpdateTileContent(tileContent);
  }, [tileContent, onUpdateTileContent]);

  // We want to scale each image in the tile by our scale factor
  const scaledHTML = React.useMemo(() => {
    // First we create a mock element in order to parse it to find the images
    const elt = document.createElement('html');
    elt.innerHTML = tileContent;
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
  }, [scaleFactor, tileContent]);

  const [size, setSize] = React.useState({ height: 10, width: 10 });
  const resizeRegistration = React.useMemo(
    () =>
      ElementResizeService.register(({ contentRect }: ResizeObserverEntry) =>
        setSize({
          height: contentRect.height,
          width: contentRect.width,
        }),
      ),
    [setSize],
  );
  const [updatedHeight, setUpdatedHeight] = React.useState({ height: 10 });
  const newHeight = size.height / scaleFactor;
  React.useEffect(() => {
    if (newHeight !== updatedHeight) {
      setUpdatedHeight(newHeight);
      onHeightUpdate(newHeight);
    }
  }, [onHeightUpdate, newHeight, updatedHeight]);

  return (
    <div
      ref={resizeRegistration.setRef}
      className="gd-dashboard-text-tile"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: scaledHTML }}
      style={{ fontSize: REFERENCE_FONT_SIZE * scaleFactor }}
    />
  );
}

export default (React.memo(TextTile): React.AbstractComponent<Props>);
