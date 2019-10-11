// @flow
import { scaleLinear, scaleBand } from '@vx/scale';

import type {
  BinDataPoint,
  BoxPlotSummary,
  BoxPlotData,
  Accessors,
  Margin,
  XScale,
  YScale,
  ViolinPatternsNames,
} from 'components/ui/visualizations/BoxPlot/types';
import type { TooltipPosition } from 'components/ui/visualizations/BoxPlot/';

export const BoxPlotDataAccessors = {
  getBinData(d: BoxPlotData): $ReadOnlyArray<BinDataPoint> {
    return d.data.binData;
  },
  getBoxPlotSummary(d: BoxPlotData): BoxPlotSummary {
    return d.data.boxPlotSummary;
  },
  getGroupName(d: BoxPlotData): string {
    return d.key;
  },
  getMin(d: BoxPlotData): number {
    return d.data.boxPlotSummary.min;
  },
  getMax(d: BoxPlotData): number {
    return d.data.boxPlotSummary.max;
  },
  getOutliers(d: BoxPlotData): $ReadOnlyArray<number> {
    return d.data.outliers;
  },
};

/**
 * Calculates the maximum and minimum value of the given data
 * @param {array} data An array containing data
 * @param {object} accessors Functions to access values to consider when
 *  calculating the minimum and maximum.
 * @returns [number, number]
 */
export function computeMinAndMax(
  data: $ReadOnlyArray<BoxPlotData | number>,
  accessors?: Accessors,
): [number, number] {
  const { getMin, getMax, getOutliers } = accessors || {};
  let currentMinValue = Number.MAX_VALUE;
  let currentMaxValue = Number.MIN_VALUE;
  data.forEach(dataPoint => {
    let minValue = Number.MAX_VALUE;
    let maxValue = Number.MIN_VALUE;

    if (typeof dataPoint === 'number') {
      minValue = dataPoint;
      maxValue = dataPoint;
    } else {
      if (typeof getMin === 'function') {
        minValue = getMin(dataPoint);
      }

      if (typeof getMax === 'function') {
        maxValue = getMax(dataPoint);
      }
    }

    // if we have outliers, include them in calculation of min and max
    if (typeof getOutliers === 'function' && typeof dataPoint !== 'number') {
      const dataPointOutliers = getOutliers(dataPoint);
      const [outliersMin, outliersMax] = computeMinAndMax(dataPointOutliers);
      minValue = Math.min(minValue, outliersMin);
      maxValue = Math.max(maxValue, outliersMax);
    }

    if (minValue < currentMinValue) {
      currentMinValue = minValue;
    }

    if (maxValue > currentMaxValue) {
      currentMaxValue = maxValue;
    }
  });
  return [currentMinValue, currentMaxValue];
}

export function computeGraphHeight(height: number, margin: Margin): number {
  return height - margin.top - margin.bottom;
}

export function computeGraphWidth(width: number, margin: Margin): number {
  return width - margin.left - margin.right;
}

export function computeYScale(
  groups: $ReadOnlyArray<BoxPlotData>,
  height: number,
  includeOutliers: boolean,
): YScale {
  const { getMin, getMax, getOutliers } = BoxPlotDataAccessors;
  const accessors = {
    getMin,
    getMax,
    getOutliers: undefined,
  };

  if (includeOutliers) {
    accessors.getOutliers = getOutliers;
  }

  const [minY, maxY] = computeMinAndMax(groups, accessors);
  const minMaxOffset = 0.2 * Math.abs(minY);
  const domain = [minY - minMaxOffset, maxY + minMaxOffset];
  const rangeRound = [height, 0];
  return scaleLinear({
    rangeRound,
    domain,
  });
}

export function computeXScale(
  groups: $ReadOnlyArray<BoxPlotData>,
  width: number,
): XScale {
  const domain = groups.map(BoxPlotDataAccessors.getGroupName);
  return scaleBand({
    domain,
    rangeRound: [0, width],
    padding: 0.4,
  });
}

export function computeTooltipPosition(
  xValue: string,
  yValue: number,
  xScale: XScale,
  yScale: YScale,
  boxPlotWidth: number,
): TooltipPosition {
  return {
    tooltipTop: yScale(yValue),
    tooltipLeft: xScale(xValue) + boxPlotWidth,
  };
}

type ViolinPatterns = {
  [ViolinPatternsNames]: $ReadOnlyArray<'horizontal' | 'diagonal' | 'vertical'>,
};

export const VIOLIN_PATTERNS: ViolinPatterns = {
  horizontal: ['horizontal'],
  vertical: ['vertical'],
  diagonal: ['diagonal'],
  horizontalAndVertical: ['horizontal', 'vertical'],
  horizontalAndDiagonal: ['horizontal', 'diagonal'],
  verticalAndDiagonal: ['vertical', 'diagonal'],
  all: ['horizontal', 'vertical', 'diagonal'],
};
