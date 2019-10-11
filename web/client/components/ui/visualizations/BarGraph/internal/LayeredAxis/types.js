// @flow
import type {
  DataPoint,
  DimensionID,
} from 'components/ui/visualizations/BarGraph/types';

export type LinearScale = any;

export type LevelSpec = {
  comparator: (a: DataPoint, b: DataPoint) => number,
  dimensionID: DimensionID,
};

export type LayerDataOld = {
  dimensionID: DimensionID,
  scale: LinearScale,
  tickValues: $ReadOnlyArray<string | null>,
};

export type LayerValue = {
  [DimensionID]: string | null,
  key: string,
};

export type LayerData = {
  layerDimensions: $ReadOnlyArray<DimensionID>,
  layerValues: $ReadOnlyArray<LayerValue>,
};
