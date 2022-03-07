// @flow
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

export const AQT_DEFAULT_VIEW_TYPE: ResultViewType = RESULT_VIEW_TYPES.TABLE;

// TODO(anyone): $SQTDeprecate - This needs to be renamed but also removed.
// RESULT_VIEW_ORDER no longer exists, meaning we should rename this constant
// to that. However, this was only used on a previous version of displaying
// visualization names in the AQT. With the visualization picker, we don't
// adhere to this style anymore, and it needs to be removed/replaced in other
// files with the proper constant.
export const AQT_RESULT_VIEW_ORDER = [
  RESULT_VIEW_TYPES.TABLE,
  RESULT_VIEW_TYPES.TIME,
  RESULT_VIEW_TYPES.MAP,
  RESULT_VIEW_TYPES.HEATTILES,
  RESULT_VIEW_TYPES.BUBBLE_CHART,
  RESULT_VIEW_TYPES.BUMP_CHART,
  RESULT_VIEW_TYPES.SUNBURST,
  RESULT_VIEW_TYPES.EXPANDOTREE,
  RESULT_VIEW_TYPES.BAR_GRAPH,
  RESULT_VIEW_TYPES.EPICURVE,
  RESULT_VIEW_TYPES.BOX_PLOT,
  RESULT_VIEW_TYPES.NUMBER_TREND,
  RESULT_VIEW_TYPES.PIE,
];
