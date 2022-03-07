// @flow
import GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import MapSettings from 'models/visualizations/MapViz/MapSettings';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';

/**
 * The purpose of the EntityFilterValueNode is to construct a node representing
 * a possible filter value that can be selected by the user, as well as the
 * category that that filter belongs to, and the parent category of that
 * filter (if applicable). If we are dealing with a complex dataset (i.e.,
 * with a hierarchy of categories), then we can later use these properties to
 * filter through the dataset and regenerate an available list of filters to
 * the user, given a selected category. The list will be based on whether or
 * not they have made any selections to the parent category, and if those
 * selections have made any filter values ineligible.
 */
export type EntityFilterValueNode = {
  /** Name and identifier of value */
  id: string,

  /**
   * The parent category of this node, if any. This is used when values of
   * one category are children of a value from a 'parent' category, for
   * complex datasets
   */
  parentValue: EntityFilterValueNode | void,

  /** This node's type, i.e., what filter category this value belongs to */
  type: string,
};

/**
 * A collection of all possible categories to filter from, and the nodes
 * we generate used to represent values in each of those categories.
 */
export type EntityFilterValueMap = {
  +[EntityFilterType: string]: $ReadOnlyArray<EntityFilterValueNode>,
};

// TODO(nina): $GISRefactor - In the future, we might use this type for more
// than just determining filter values, so we might need to rename it
/** A list of filter categories that also map to their parent categories */
export type FilterCategoryHierarchy = $ReadOnlyArray<{
  property: string,
  parent: string,
}>;

/**
 * A mapping of selected filter categories (if any), given a particular
 * filterable layer, to a list of values selected for that filter category
 */
export type FilterValueSelections = {
  +[filterCategory: string]: $ReadOnlyArray<string>,
  ...,
};

/**
 * A collection of different properties imported from a query session in the
 * AQT, that we then use build a layer representing indicator data in the
 * GIS tool.
 */
export type IndicatorLayerData = {
  controls: MapSettings,
  groupBySettings: GroupBySettings,
  layerId: string,
  legendSettings: LegendSettings,
  name: string,
  querySelections: QuerySelections,
  querySpec: QueryResultSpec,
  seriesSettings: SeriesSettings,
};

// Legend position options
export type LegendPositionType =
  | 'TOP_LEFT'
  | 'TOP_RIGHT'
  | 'BOTTOM_LEFT'
  | 'BOTTOM_RIGHT'
  | 'DEFAULT';

/** The thickness of a line drawing a shape layer */
export type ShapeLayerOutlineWidthType = 'none' | 'thin' | 'normal' | 'thick';
