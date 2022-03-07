// @flow
import type DataActionGroup from 'models/core/QueryResultSpec/DataActionGroup';
import type { MapDataPoint } from 'models/visualizations/MapViz/types';

export default function buildFeatureColorGenerator(
  selectedFieldId: string,
  selectedFieldValues: $ReadOnlyArray<number | null>,
  dataActionGroup: DataActionGroup | void,
  defaultColor: string,
): string | (MapDataPoint => string) {
  if (dataActionGroup === undefined) {
    // HACK(stephen): The only place where color is directly set on the
    // MapDataPoint is DQL. This is very different from other usages of the
    // map and should be reviewed.
    return d => d.color || defaultColor;
  }

  return dataPoint =>
    dataActionGroup.getValueColor(
      dataPoint.metrics[selectedFieldId],
      selectedFieldValues,
      defaultColor,
    ) || defaultColor;
}
