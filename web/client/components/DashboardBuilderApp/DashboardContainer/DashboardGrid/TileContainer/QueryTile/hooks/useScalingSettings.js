// @flow
import * as React from 'react';

import QueryScalingContext, {
  ENABLE_VISUALIZATION_SPECIFIC_SCALING,
} from 'components/common/QueryScalingContext';
import type { StyleObject } from 'types/jsCore';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

// NOTE(stephen): We need to define the padding here vs in CSS since we need to
// be able to scale this padding depending on the current scaling behavior.
const QUERY_RESULT_PADDING = 12;

/**
 * For the given visualization type, produce CSS styles to apply to the
 * QueryTile that will allow the visualization to render at the desired
 * resolution while also fitting inside the available space.
 */
export default function useScalingSettings(
  collapse: boolean,
  visualizationType: VisualizationType,
  referenceHeight: number,
  referenceWidth: number,
  scaleFactor: number,
): [
  StyleObject | void, // Container style
  StyleObject | void, // Inner style
  $ContextType<typeof QueryScalingContext>,
] {
  return React.useMemo(() => {
    // If we are in "collapsed layout" mode, then there should be no styling
    // adjustments applied.
    if (collapse) {
      return [undefined, undefined, undefined];
    }

    // If the visualization can handle scaling itself, like how the map can
    // adjust the zoom level directly to match the scaling required, then we do
    // not need to apply any styles related to scaling at the container level.
    // The context will pass this information down.
    if (ENABLE_VISUALIZATION_SPECIFIC_SCALING.includes(visualizationType)) {
      const containerStyle = undefined;
      const innerStyle = {
        height: referenceHeight * scaleFactor,
        padding: QUERY_RESULT_PADDING * scaleFactor,
        width: referenceWidth * scaleFactor,
      };
      const context = { referenceHeight, referenceWidth, scaleFactor };
      return [containerStyle, innerStyle, context];
    }

    // Most visualizations cannot handle scaling themselves. Instead, we will
    // apply a scaling factor at the parent container level and adjust the
    // stylings of the rendered visualization. The visualizations rendered this
    // way do not have any knowledge that scaling is happenning, they will just
    // render to a specific height/width that they are provided.
    const containerStyle = {
      transform: `scale(${scaleFactor})`,
      transformOrigin: 'left top',
    };
    const innerStyle = {
      height: referenceHeight,
      padding: QUERY_RESULT_PADDING,
      width: referenceWidth,
    };
    return [containerStyle, innerStyle, undefined];
  }, [
    collapse,
    referenceHeight,
    referenceWidth,
    scaleFactor,
    visualizationType,
  ]);
}
