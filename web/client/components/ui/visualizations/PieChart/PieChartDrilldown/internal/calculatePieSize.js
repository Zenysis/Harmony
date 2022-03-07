// @flow

/**
 * Calculate the best pie chart diameter to use. This tries to optimize the
 * tradeoffs between pie chart size vs reducing scrolling if not needed vs
 * fitting within the column count restriction.
 */
export default function calculatePieSize(
  chartHeight: number,
  chartWidth: number,
  pieCount: number,
  padding: number,
  maxColumns: number,
): number {
  const rawDiameter = Math.min(chartHeight, chartWidth);

  // NOTE(stephen): Ensure the dimensions are never negative.
  const maxDiameter = rawDiameter - padding;
  if (maxDiameter < 1) {
    return 1;
  }

  // If there is only one pie chart to show, we can fill the full space.
  if (pieCount < 2 || maxColumns < 1) {
    return maxDiameter;
  }

  // Calculate the minimum diameter that will be used if each column is needed.
  const minDiameter = Math.max(chartWidth / maxColumns - padding, 1);
  const chartArea = chartHeight * chartWidth;

  // Calculate the maximum number of pies that can fit without scrolling.
  for (let columnCount = 1; columnCount < maxColumns; columnCount++) {
    const diameter = rawDiameter / columnCount - padding;
    if (diameter < 1) {
      break;
    }

    const pieArea = pieCount * diameter ** 2;
    if (pieArea <= chartArea) {
      return diameter;
    }
  }

  return minDiameter;
}
