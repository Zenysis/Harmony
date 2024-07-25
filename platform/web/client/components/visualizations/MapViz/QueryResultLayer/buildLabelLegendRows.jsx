// @flow
import type { MapLabelProperties } from 'models/visualizations/MapViz/types';
import type { RowData } from 'components/ui/visualizations/MapCore/SimpleLegend/SimpleLegendItem';

export default function buildLabelLegendRows(
  labelsToDisplay: MapLabelProperties,
): $ReadOnlyArray<RowData> {
  const visibleFieldRows: Array<RowData> = Object.keys(labelsToDisplay).map(
    labelId => {
      const obj = labelsToDisplay[labelId];
      return {
        color: obj.color,
        label: obj.label,
      };
    },
  );
  return visibleFieldRows;
}
