// @flow
import { scaleBand, scaleLinear } from '@vx/scale';

import type BumpChartTheme from 'components/ui/visualizations/BumpChart/models/BumpChartTheme';
import type {
  ColorScaleMap,
  DataPoint,
  LineData,
  Margin,
  ValueDomainMap,
} from 'components/ui/visualizations/BumpChart/types';
import type { RawTimestamp } from 'components/visualizations/BumpChart/types';

// Data point accessor functions. Useful for passing as callbacks to D3 methods
// that loop over an array of data.
export const DataPointView = {
  getValue(d: DataPoint): number {
    return d.val;
  },

  getRank(d: DataPoint): number {
    return d.rank;
  },

  getTimestamp(d: DataPoint): RawTimestamp {
    return d.timestamp;
  },
};

export function getLabel(line: LineData): string {
  return line ? line[0].label : '';
}

/**
 * Find the minimum and maximum values for each timestamp column in the data.
 * These values are used for producing the heat tiles gradient for each
 * timestamp column.
 */
export function buildValueDomains(
  data: $ReadOnlyArray<LineData>,
): ValueDomainMap {
  const output: ValueDomainMap = {};
  data.forEach(line => {
    line.forEach(({ timestamp, val }) => {
      if (!output[timestamp]) {
        output[timestamp] = [Infinity, -Infinity];
      }

      const minMax = output[timestamp];
      minMax[0] = Math.min(minMax[0], val);
      minMax[1] = Math.max(minMax[1], val);
    });
  });

  return output;
}

/**
 * For each timestamp's value domain ([min, max] value of each column),
 * generate a color scaling function that can produce a color for a given value
 * in that column.
 */
export function buildGlyphColorScales(
  valueDomains: ValueDomainMap,
  theme: BumpChartTheme,
): ColorScaleMap {
  const output: ColorScaleMap = {};
  const heatTilesColorRange = theme.heatTilesColorRange();
  const range = [heatTilesColorRange.get(0), heatTilesColorRange.get(1)];
  Object.entries(valueDomains).forEach(([dateVal, domain]) => {
    output[dateVal] = scaleLinear({ range, domain });
  });
  return output;
}

/**
 * Build the x-axis scale that can convert a given line's date value (bucket)
 * into the appropriate x-axis positioning.
 */
export function buildXScale(dates: $ReadOnlyArray<RawTimestamp>, xMax: number) {
  return scaleBand({
    range: [0, xMax],
    domain: dates,
  });
}

/**
 * Build the y-axis scale that can convert a given line's value (rank) into the
 * appropriate y-axis positioning.
 */
export function buildYScale(data: $ReadOnlyArray<LineData>, yMax: number) {
  return scaleLinear({
    range: [0, yMax],
    domain: [0, data.length - 1],
    nice: true,
  });
}

/**
 * Compute the largest x-coordinate value that will fit within the chart's width
 * and margins.
 */
export function calculateXMax(
  width: number,
  margin: Margin,
  numBands: number,
): number {
  const { left, right } = margin;
  const graphWidth = width - left - right;

  // If we only have 1 band, fill the full graph width. This avoids a "divide by
  // zero" issue.
  if (numBands < 2) {
    return graphWidth;
  }

  // Force the range to fill the full graph width and not add padding on either
  // side.
  return graphWidth + (graphWidth / (numBands - 1)); // prettier-ignore
}

/**
 * Compute the largest y-coordinate value that will fit within the chart's width
 * and margins.
 */
export function calculateYMax(height: number, { top, bottom }: Margin): number {
  return height - top - bottom;
}
