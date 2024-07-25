// @flow
import * as React from 'react';
import invariant from 'invariant';

import I18N from 'lib/I18N';
import Popover from 'components/ui/Popover';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import { VISUALIZATION_INFO } from 'models/AdvancedQueryApp/VisualizationType/registry';

type Props = {
  children: React.Node,
  className: string,
  onClick: () => void,
  tooltipText?: string,
};

// TODO: $VizPicker - This is an isolated component that is meant to
// replicate the functionality of a tooltip. We need to eventually replace this
// with a new UI component version of the tooltip.
export default function ControlBarButtonTooltip({
  children,
  className,
  onClick,
  tooltipText,
}: Props): React.Element<'div'> {
  const vizPickerContext = React.useContext(VisualizationPickerContext);
  const { displayedVisualizationType } = vizPickerContext;

  invariant(
    displayedVisualizationType !== undefined,
    'There must be a defined displayedVisualizationType',
  );

  let label;
  if (tooltipText !== undefined) {
    label = tooltipText;
  } else {
    label = `${I18N.text('Current')}: ${
      VISUALIZATION_INFO[displayedVisualizationType].name
    }`;
  }

  const tooltipRef = React.useRef();
  const [showPopover, setShowPopover] = React.useState(false);

  const onMouseOver = () => setShowPopover(true);
  const onMouseOut = () => setShowPopover(false);
  const onPopoverClick = () => {
    setShowPopover(false);
    onClick();
  };

  return (
    <div
      ref={tooltipRef}
      className={className}
      onBlur={onMouseOut}
      onClick={onPopoverClick}
      onFocus={onMouseOver}
      onMouseOut={onMouseOut}
      onMouseOver={onMouseOver}
      role="button"
    >
      {children}
      <Popover
        anchorElt={tooltipRef.current}
        anchorOuterSpacing={0}
        blurType={Popover.BlurTypes.DOCUMENT}
        className="visualization-picker-control-bar__tooltip"
        isOpen={showPopover}
      >
        {label}
      </Popover>
    </div>
  );
}
