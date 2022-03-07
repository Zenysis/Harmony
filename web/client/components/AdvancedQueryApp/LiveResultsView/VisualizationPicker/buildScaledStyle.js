// @flow
import QueryScalingContext from 'components/common/QueryScalingContext';
import type { StyleObject } from 'types/jsCore';

const CONTROL_BAR_HEIGHT = 35;

/**
 * The buildScaledStyle() is responsible for returning style objects that
 * resize different screens of the VisualizationPicker component hierarchy.
 * If the QueryScalingContext is not defined, then no styles are returned.
 */
export default function buildScaledStyle(
  context: $ContextType<typeof QueryScalingContext>,
): { containerStyle: StyleObject | void, overlayStyle: StyleObject | void } {
  if (context === undefined) {
    return { containerStyle: undefined, overlayStyle: undefined };
  }

  const { referenceHeight, referenceWidth, scaleFactor } = context;

  // The container should only ever take up the control bar's height in the DOM.
  const containerHeight = CONTROL_BAR_HEIGHT * scaleFactor;
  const containerStyle = {
    height: containerHeight,
    minHeight: containerHeight,
    minWidth: referenceWidth,
    transform: `scale(${scaleFactor})`,
    transformOrigin: 'top',
    width: referenceWidth,
  };

  // Overlays handle positioning themselves and should take up the full height
  // of the query result container.
  const overlayStyle = {
    height: referenceHeight,
    minHeight: referenceHeight,
  };

  return { containerStyle, overlayStyle };
}
