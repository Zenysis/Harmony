// @flow
import type { DataPoint as BarGraphDataPoint } from 'components/ui/visualizations/BarGraph/types';

// The data point format for BubbleChart is the same as the bar graph.
// NOTE(stephen): Duplicating the type here so it can be customized in the
// future without needing to update references.
export type DataPoint = BarGraphDataPoint;
