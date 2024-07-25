// @flow
import * as React from 'react';

import { VISUALIZATION_TYPE } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

/**
 * This context holds global state shared among the LiveResultsView
 * component hierarchy.
 */
type QueryScalingContext = {
  referenceHeight: number,
  referenceWidth: number,
  scaleFactor: number,
};

export const INITIAL_QUERY_SCALING_VALUES = {
  referenceHeight: 1050,
  referenceWidth: 1050,
  scaleFactor: 1,
};

/**
 * Stores visualizations that do not rely on top-level scaling, which means
 * that they are responsible for appropriately handling their own scaling
 * treatment.
 */
export const ENABLE_VISUALIZATION_SPECIFIC_SCALING: $ReadOnlyArray<VisualizationType> = [
  VISUALIZATION_TYPE.MAP,
  VISUALIZATION_TYPE.MAP_ANIMATED,
  VISUALIZATION_TYPE.MAP_HEATMAP,
  VISUALIZATION_TYPE.MAP_HEATMAP_ANIMATED,
  VISUALIZATION_TYPE.NUMBER_TREND,
];

// Some components will be rendered and have access to this context's values,
// even if they are being rendered by another parent with no intention of
// using this context. We add type void in those cases.
export default (React.createContext(): React.Context<QueryScalingContext | void>);
