// @flow
import invariant from 'invariant';

import { VISUALIZATION_TO_VIEW_TYPE } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

/**
 * Change the settings in the QueryResultSpec to correspond to the settings
 * configuration expected by the `destinationVisualizationType`.
 *
 * @param {QueryResultSpec} queryResultSpec The query result spec whose settings
 * we will change
 * @param {VisualizationType} destinationVisualizationType the visualization type
 * we will change to. A visualization type is a more specific form of a
 * ResultViewType.
 *
 * @return {[QueryResultSpec, ResultviewType]} Tuple of the new query result spec,
 * with the new settings applied, and the ResultViewType we have changed to.
 */
export default function selectVisualization(
  queryResultSpec: QueryResultSpec,
  destinationVisualizationType: VisualizationType,
): [QueryResultSpec, ResultViewType] {
  const viewType = VISUALIZATION_TO_VIEW_TYPE[destinationVisualizationType];
  const newVizControls = queryResultSpec
    .getVisualizationControls(viewType)
    .changeToVisualizationType(destinationVisualizationType);
  let seriesSettings = queryResultSpec.getSeriesSettings(viewType);

  // Apply additional settings that cannot be handled purely through a controls
  // merge.
  switch (destinationVisualizationType) {
    case 'BAR_LINE': {
      // The Bar + Line viz needs to ensure one indicator is on the Y1-Axis and
      // one indicator is on the Y2-Axis.
      const seriesOrder = seriesSettings.seriesOrder();
      invariant(
        seriesOrder.length > 1,
        'Cannot produce Bar+Line graph with only one series.',
      );
      const { y1AxisSeries, y2AxisSeries } = seriesSettings.getSeriesByAxes();
      if (y1AxisSeries.length === 0) {
        // Move the first series to the Y1-Axis. If the first series is assigned
        // to the Y2-Axis, choose the second field.
        const fieldId = !y2AxisSeries.includes(seriesOrder[0])
          ? seriesOrder[0]
          : seriesOrder[1];
        seriesSettings = seriesSettings.updateSeries(
          fieldId,
          'yAxis',
          'y1Axis',
        );
      }
      if (y2AxisSeries.length === 0) {
        // Move the last series to the Y2-Axis.
        seriesSettings = seriesSettings.updateSeries(
          seriesOrder[seriesOrder.length - 1],
          'yAxis',
          'y2Axis',
        );
      }
      break;
    }
    default:
  }

  const newQueryResultSpec = queryResultSpec.updateVisualizationSettings(
    viewType,
    vizSettings =>
      vizSettings
        .seriesSettings(seriesSettings)
        .viewSpecificSettings(newVizControls),
  );

  return [newQueryResultSpec, viewType];
}
