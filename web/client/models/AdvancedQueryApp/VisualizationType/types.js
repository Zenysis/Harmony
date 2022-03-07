// @flow
import type { IconType } from 'components/ui/Icon/types';
import type { StyleObject } from 'types/jsCore';

/**
 * This file contains core types to manage the visualization picker in AQT.
 * NOTE(pablo): Do not confuse VisualizationType with ResultViewType.
 *   - A ResultViewType is a core visualization (like the bar graph, or line
 *   graph).
 *   - A VisualizationType can represent a specific configuration of a
 *   ResultViewType. For example, a BAR_STACKED visualization is still the same
 *   core visualization (bar graph), but it's settings are configured to stack
 *   the bars.
 * TODO(pablo, stephen): ResultViewType vs. VisualizationType are confusing
 * names and we should think of better ways to distinguish them.
 */

export type VisualizationTypeMap = {
  BAR: 'BAR',
  BAR_LINE: 'BAR_LINE',
  BAR_OVERLAPPING: 'BAR_OVERLAPPING',
  BAR_STACKED: 'BAR_STACKED',
  BAR_HORIZONTAL: 'BAR_HORIZONTAL',
  BAR_HORIZONTAL_LINE: 'BAR_HORIZONTAL_LINE',
  BAR_HORIZONTAL_OVERLAPPING: 'BAR_HORIZONTAL_OVERLAPPING',
  BAR_HORIZONTAL_STACKED: 'BAR_HORIZONTAL_STACKED',
  BOXPLOT: 'BOXPLOT',
  EPICURVE: 'EPICURVE',
  HEATTILES: 'HEATTILES',
  HIERARCHY: 'HIERARCHY',
  LINE: 'LINE',
  MAP: 'MAP',
  MAP_ANIMATED: 'MAP_ANIMATED',
  MAP_HEATMAP: 'MAP_HEATMAP',
  MAP_HEATMAP_ANIMATED: 'MAP_HEATMAP_ANIMATED',
  NUMBER_TREND: 'NUMBER_TREND',
  NUMBER_TREND_SPARK_LINE: 'NUMBER_TREND_SPARK_LINE',
  PIE: 'PIE',
  RANKING: 'RANKING',
  SCATTERPLOT: 'SCATTERPLOT',
  SUNBURST: 'SUNBURST',
  TABLE: 'TABLE',
  TABLE_SCORECARD: 'TABLE_SCORECARD',
};

export type VisualizationGroupMap = {
  GEOGRAPHIC: 'GEOGRAPHIC',
  OTHER: 'OTHER',
  TABLE_AND_BAR: 'TABLE_AND_BAR',
  TIME: 'TIME',
};

export type VisualizationType = $Keys<VisualizationTypeMap>;
export type VisualizationGroup = $Keys<VisualizationGroupMap>;

export type VisualizationInfo = {
  // this visualization's name
  name: string,

  // this visualization's icon to render
  icon: IconType,

  // Optional style to pass down when rendering the icon.
  iconStyle?: StyleObject,
};

// The metadata for a visualization group
export type VisualizationGroupInfo = {
  // this group's name
  name: string,

  // Ordered list of visualization types for each grouping.
  visualizations: $ReadOnlyArray<VisualizationType>,
};

// TODO(stephen): Formalize these requirement structures.
export type VisualizationCriteria = {
  +min: number,
  +max: number | void,
};

export type VisualizationGroupingCriteria = {
  +type: 'DIMENSION' | 'GEOGRAPHY' | 'TIME',
  ...VisualizationCriteria,
};

// Represents the field and grouping requirements to render a visualization
export type VisualizationRequirement = {
  +field: VisualizationCriteria,

  // NOTE(stephen): If the DIMENSION type appears at the same time as a TIME
  // or GEOGRAPHY type, then the DIMENSION requirements represent the number
  // of groupings needed *after the more specific types are accounted for*. So
  // if the criteria specifies:
  // [ { type: 'TIME', min: 1, max: 1 }, { type: 'DIMENSION', min: 1, max: 1 }]
  // then this means the user must select 1 time grouping and also one non-time
  // grouping. See `computeStatusMap.js` for the implementation.
  +grouping: $ReadOnlyArray<VisualizationGroupingCriteria> | void,
};

// Represents the type of requirements to condider when computing enabled requirements
export type VisualizationRequirementsTypes = 'CORE' | 'LOOSE';

// Tracks the status of a visualization's requirements: what criteria have
// been satisfied or not.
export type VisualizationRequirementStatus = {
  +field: { +satisfied: boolean },
  +grouping: $ReadOnlyArray<{
    +type: 'DIMENSION' | 'GEOGRAPHY' | 'TIME',
    +satisfied: boolean,
  }> | void,
};

export type VisualizationRequirementsMap = $ReadOnly<
  $ObjMap<VisualizationTypeMap, () => VisualizationRequirement>,
>;

export type VisualizationRequirementStatusMap = {
  +[VisualizationType]: VisualizationRequirementStatus,
  ...,
};
