// @flow
import * as Zen from 'lib/Zen';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

export interface IViewSpecificSettings<Self> {
  /**
   * Propagate GroupBySettings changes into the ViewSpecificSettings. Many
   * settings store references to selected grouping IDs. (e.g. per column
   * styling in the table). This method ensures that those settings remain
   * valid when the GroupBySettings change.
   *
   * @param {GroupBySettings} newGroupBySettings The new series settings
   * @returns {this}
   */
  updateFromNewGroupBySettings(
    newGroupBySettings: GroupBySettings,
  ): Zen.Model<Self>;

  /**
   * Propagate SeriesSettings changes into the ViewSpecificSettings. Many
   * settings store references to selected field IDs (like when choosing which
   * field to sort by). When a field is removed from the query (both a regular
   * Field or a CustomField), the field ID stored in the ViewSpecificSettings
   * might no longer be valid. This method ensures the current settings remain
   * valid.
   *
   * @param {SeriesSettings} newSeriesSettings The new series settings
   * @returns {this}
   */
  updateFromNewSeriesSettings(
    newSeriesSettings: SeriesSettings,
  ): Zen.Model<Self>;

  /**
   * This ViewType's default field title to display in the title. Sometimes we
   * can use the view-specific settings to extract a field that should be used
   * as the title field. Sometimes this isn't applicable, so we return void.
   * @returns {string | void} the field id to use for this visualization's title
   * or undefined if there is no field that can be used for the title.
   */
  getTitleField(): string | void;

  /**
   * Some view types allow sub-types with specific settings configurations.
   * For example, the bar graph can be broken down into a regular BAR graph,
   * BAR_LINE, or a BAR_STACKED visualization.
   */
  changeToVisualizationType(vizType: VisualizationType): Zen.Model<Self>;
}
