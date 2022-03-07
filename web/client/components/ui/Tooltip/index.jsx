// @flow
import * as React from 'react';

import Popover from 'components/ui/Popover';

const ORIGIN_PLACEMENT = {
  left: Popover.Origins.LEFT_CENTER,
  right: Popover.Origins.RIGHT_CENTER,
  top: Popover.Origins.TOP_CENTER,
  bottom: Popover.Origins.BOTTOM_CENTER,
};

const POPOVER_PLACEMENT = {
  left: Popover.Origins.RIGHT_CENTER,
  right: Popover.Origins.LEFT_CENTER,
  top: Popover.Origins.BOTTOM_CENTER,
  bottom: Popover.Origins.TOP_CENTER,
};

type Props = {
  /** The always visible element that, when hovered, will trigger the tooltip
   * to be shown.
   */
  children: React.Node,

  /** The content to display inside the tooltip. */
  content?: React.Node,

  /** Option to delay the ms time it takes for tooltip to display on hover. */
  delayTooltip?: number,

  /** Used to force the tooltip to be hidden */
  forceHideTooltip?: boolean,

  /** Optional className to apply to the popover element. */
  popoverClassName?: string,

  /**
   * Optional className to apply to the hover target element that wraps
   * `children`.
   */
  targetClassName?: string,

  /** Where the tooltip will be positioned relative to the content */
  tooltipPlacement?: 'left' | 'right' | 'top' | 'bottom',
};

/**
 * Open a tooltip popover when the child element is hovered over.
 */
function Tooltip({
  children,
  content = undefined,
  delayTooltip = 0,
  forceHideTooltip = false,
  popoverClassName = '',
  targetClassName = '',
  tooltipPlacement = 'bottom',
}: Props) {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [anchorElt, setAnchorElt] = React.useState<?HTMLSpanElement>();
  const hoverTimerRef = React.useRef<TimeoutID | void>(undefined);

  React.useEffect(() => {
    if (!anchorElt) {
      return;
    }

    const onHoverStart = () => {
      if (delayTooltip === 0) {
        setShowTooltip(true);
        return;
      }

      if (hoverTimerRef.current !== undefined) {
        clearTimeout(hoverTimerRef.current);
      }
      hoverTimerRef.current = setTimeout(
        () => setShowTooltip(true),
        delayTooltip,
      );
    };

    const onHoverEnd = () => {
      if (hoverTimerRef.current !== undefined) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = undefined;
      }
      setShowTooltip(false);
    };

    // NOTE(stephen): If the Tooltip component wraps a `children` element that
    // contains a `<button disabled>` element, and the disabled button is the
    // target of the `onMouseEnter` event, then `onMouseLeave` will not get
    // triggered (https://github.com/facebook/react/issues/18753). We can fix
    // this by moving to `onPointerLeave`, however some of our minimum browser
    // versions do not support it. For now, we will directly set event listeners
    // instead of relying on react to mount them.
    anchorElt.addEventListener('mouseenter', onHoverStart);
    anchorElt.addEventListener('mouseleave', onHoverEnd);

    // eslint-disable-next-line consistent-return
    return () => {
      anchorElt.removeEventListener('mouseenter', onHoverStart);
      anchorElt.removeEventListener('mouseleave', onHoverEnd);
    };
  }, [anchorElt, delayTooltip]);

  return (
    <React.Fragment>
      <span className={`zen-tooltip ${targetClassName}`} ref={setAnchorElt}>
        {children}
      </span>
      {content !== undefined && (
        <Popover
          anchorElt={anchorElt}
          anchorOrigin={ORIGIN_PLACEMENT[tooltipPlacement]}
          blurType={Popover.BlurTypes.DOCUMENT}
          className={`zen-tooltip__popover ${popoverClassName}`}
          isOpen={showTooltip && !forceHideTooltip}
          popoverOrigin={POPOVER_PLACEMENT[tooltipPlacement]}
        >
          {content}
        </Popover>
      )}
    </React.Fragment>
  );
}

export default (React.memo(Tooltip): React.AbstractComponent<Props>);
