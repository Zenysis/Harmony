// @flow
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type SettingRequirements = {
  +needsAxesSettings: boolean,
  +needsLegendSettings: boolean,
};

/**
 * Get the settings requirements for a given view type. For example,
 * does a given view type need axes settings?
 */
export default function getSettingRequirements(
  viewType: ResultViewType,
): SettingRequirements {
  switch (viewType) {
    case 'MAP':
      return {
        needsAxesSettings: false,
        needsLegendSettings: true,
      };
    case 'BAR_GRAPH':
      return {
        needsAxesSettings: true,
        needsLegendSettings: true,
      };
    case 'BOX_PLOT':
      return {
        needsAxesSettings: true,
        needsLegendSettings: false,
      };
    case 'BUBBLE_CHART':
      return {
        needsAxesSettings: true,
        needsLegendSettings: false,
      };
    case 'BUMP_CHART':
      return {
        needsAxesSettings: false,
        needsLegendSettings: false,
      };
    case 'EPICURVE':
      return {
        needsAxesSettings: true,
        needsLegendSettings: false,
      };
    case 'EXPANDOTREE':
      return {
        needsAxesSettings: false,
        needsLegendSettings: false,
      };
    case 'HEATTILES':
      return {
        needsAxesSettings: true,
        needsLegendSettings: false,
      };
    case 'NUMBER_TREND':
      return {
        needsAxesSettings: false,
        needsLegendSettings: false,
      };
    case 'PIE':
      return {
        needsAxesSettings: false,
        needsLegendSettings: false,
      };
    case 'SUNBURST':
      return {
        needsAxesSettings: false,
        needsLegendSettings: false,
      };
    case 'TABLE':
      return {
        needsAxesSettings: false,
        needsLegendSettings: true,
      };
    case 'TIME':
      return {
        needsAxesSettings: true,
        needsLegendSettings: false,
      };
    default: {
      (viewType: empty);
      throw new Error(`Invalid view type received: ${viewType}`);
    }
  }
}
