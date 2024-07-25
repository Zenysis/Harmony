// @flow

type SimpleDataPoint = {
  x: number,
  y: number,
};

type DiffDataPoint = {
  dx: number,
  dy: number,
};

/**
 * Returns adjusted x and y values based on the slope of the line before and
 * after the current point we are evaluating -- point2.
 * @param{point2} the data point for which we are calculating the adjusted values.
 * @param{point1} the data point before point2
 * @param{point3} the data point after point2
 */
export function getDataPointAdjustments(
  point1: SimpleDataPoint | void,
  point2: SimpleDataPoint,
  point3: SimpleDataPoint | void,
  barWidth: number,
): DiffDataPoint {
  // The left shift and right shift adjustments are calculated based off the
  // bar width.
  const noShift = { dx: 0, dy: 0 };
  const shiftLeft = { dx: -barWidth * 0.45, dy: 0 };
  const shiftRight = { dx: barWidth * 0.1, dy: 0 };
  const shiftUp = { dx: 0, dy: -5 };
  const shiftDown = { dx: 0, dy: 10 };

  if (point1 === undefined && point3 === undefined) {
    return noShift;
  }
  if (point1 === undefined) {
    return shiftLeft;
  }
  if (point3 === undefined) {
    return shiftRight;
  }

  // Calculate the slope of the line before and after point2. Note that the
  // x, y values are based off the svg coordinate system where 0,0 is the top
  // left of the chart, so the adjustments are based off the inverse of the
  // slopes.
  const slope1 = (point2.y - point1.y) / (point2.x - point1.x);
  const slope2 = (point3.y - point2.y) / (point3.x - point2.x);
  if (slope1 > 0 && slope2 > 0) {
    return shiftRight;
  }
  if (slope1 < 0 && slope2 < 0) {
    return shiftLeft;
  }
  if (slope1 > 0 && slope2 < 0) {
    return shiftDown;
  }
  if (slope1 < 0 && slope2 > 0) {
    return shiftUp;
  }
  return noShift;
}
