// @flow
import * as React from 'react';

import InfoTooltip from 'components/ui/InfoTooltip';
import Popover from 'components/ui/Popover';
import type { IconType } from 'components/ui/Icon/types';

type Props = {
  buttonIconType: IconType,
  children: React.Node,

  buttonClassName?: string,
  buttonTooltipText?: string | void,
  className?: string,
};

/**
 * The OverlayOptionButton provides a standard way for adding an on-map control
 * that triggers an overlay popup. The on-map control is a button with an icon
 * that when clicked will open a popover.
 */
function OverlayOptionButton({
  buttonIconType,
  children,
  buttonClassName = '',
  buttonTooltipText = undefined,
  className = '',
}: Props) {
  const [showPanel, setShowPanel] = React.useState<boolean>(false);
  const [buttonElt, setButtonElt] = React.useState<?HTMLDivElement>(null);
  const onTogglePanelVisibility = React.useCallback(() => {
    setShowPanel(!showPanel);
  }, [showPanel]);

  return (
    <div className={`overlay-option-button ${className} hide-on-export`}>
      <div
        className={`overlay-option-button__map-button ${buttonClassName}`}
        onClick={onTogglePanelVisibility}
        ref={setButtonElt}
        role="button"
      >
        <InfoTooltip
          iconType={buttonIconType}
          tooltipPlacement="top"
          text={buttonTooltipText}
        />
      </div>
      <Popover
        anchorElt={buttonElt}
        anchorOrigin={Popover.Origins.BOTTOM_CENTER}
        blurType={Popover.BlurTypes.DOCUMENT}
        isOpen={!!buttonElt && showPanel}
        onRequestClose={onTogglePanelVisibility}
        popoverOrigin={Popover.Origins.TOP_RIGHT}
        zIndex={10}
      >
        {children}
      </Popover>
    </div>
  );
}

export default (React.memo(
  OverlayOptionButton,
): React.AbstractComponent<Props>);
