// @flow
import { RESULT_VIEW_TYPES } from 'components/QueryResult/common';
import type { AxesSettingsOptions } from 'components/visualizations/common/SettingsModal/AxesSettingsTab';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

// eslint-disable-next-line import/prefer-default-export
export function getAxesSettingsOptions(
  viewType: ResultViewType,
): $Shape<AxesSettingsOptions> | null {
  switch (viewType) {
    case RESULT_VIEW_TYPES.CHART:
      return {
        hasGoalLine: true,
      };
    case RESULT_VIEW_TYPES.BAR_GRAPH:
      // TODO(stephen): Support this control eventually.
      return {
        hasAxisRangeSupport: false,
      };
    default:
      return null;
  }
}
