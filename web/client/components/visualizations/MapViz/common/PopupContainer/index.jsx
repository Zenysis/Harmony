// @flow
import * as React from 'react';

import Popover from 'components/ui/Popover';
import { MapContext } from 'components/ui/visualizations/MapCore';

type Props = {
  children: React.Node,
  latitude: number,
  longitude: number,
  onRequestClose: (SyntheticMouseEvent<HTMLElement> | Event) => void,
};

function getOffsetPosition(
  x: number,
  y: number,
  container: HTMLElement,
): [number, number] {
  const { height } = container.getBoundingClientRect();
  const scale = height / container.clientHeight;
  return [Math.floor(x * scale), Math.floor(y * scale)];
}

/**
 * The PopupContainer provides a standard way to render a popover on the map
 * that is centered beneath a lat/lon point.
 */
function PopupContainer({
  children,
  latitude,
  longitude,
  onRequestClose,
}: Props) {
  const { container, viewport } = React.useContext(MapContext);
  const [x, y] = viewport.project([longitude, latitude]);

  // Prevent the popup from rendering when it is off screen.
  // NOTE(stephen): This will not change whether the feature being displayed
  // is still active or not. If the user pans the map so that the lat/lon is
  // no longer visible, and then pans back in, the popup will begin showing
  // again.
  if (x < 0 || x > viewport.width || y < 0 || y > viewport.height) {
    return null;
  }

  const [offsetX, offsetY] = getOffsetPosition(x, y, container);
  return (
    <Popover
      anchorElt={container}
      anchorOrigin={Popover.Origins.TOP_LEFT}
      blurType={Popover.BlurTypes.DOCUMENT}
      className="map-popup-container"
      containerType={Popover.Containers.NONE}
      doNotFlip
      isOpen
      offsetX={offsetX}
      offsetY={offsetY}
      onRequestClose={onRequestClose}
      popoverOrigin={Popover.Origins.BOTTOM_CENTER}
      zIndex={10}
    >
      <div className="map-popup-container__content">{children}</div>
      <div className="map-popup-container__tip" />
    </Popover>
  );
}

export default (React.memo(PopupContainer): React.AbstractComponent<Props>);
