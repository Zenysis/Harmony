// @flow
import * as React from 'react';
import invariant from 'invariant';

import Popover from 'components/ui/Popover';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import { VISUALIZATION_INFO } from 'models/AdvancedQueryApp/VisualizationType/registry';

type Props = {
  className: string,
  children: React.Node,
  onClick: () => void,
  tooltipText?: string,
};

const TEXT_PATH =
  'AdvancedQueryApp.LiveResultsView.VisualizationPicker.ControlBar';
const TEXT = t(TEXT_PATH);

// TODO(nina): $VizPicker - This is an isolated component that is meant to
// replicate the functionality of a tooltip. We need to eventually replace this
// with a new UI component version of the tooltip.
export default function ControlBarButtonTooltip({
  className,
  children,
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
    label = `${TEXT.currentDisplay} ${VISUALIZATION_INFO[displayedVisualizationType].name}`;
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
      onClick={onPopoverClick}
      onMouseOver={onMouseOver}
      onFocus={onMouseOver}
      onMouseOut={onMouseOut}
      onBlur={onMouseOut}
      role="button"
    >
      {children}
      <Popover
        className="visualization-picker-control-bar__tooltip"
        anchorElt={tooltipRef.current}
        blurType={Popover.BlurTypes.DOCUMENT}
        isOpen={showPopover}
        anchorOuterSpacing={0}
      >
        {label}
      </Popover>
    </div>
  );
}
