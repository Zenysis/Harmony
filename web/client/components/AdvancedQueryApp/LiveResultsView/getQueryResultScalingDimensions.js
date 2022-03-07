// @flow

// NOTE(nina): This is an equation that was created by inputting a set of screen
// resolutions and corresponding desired reference widths. We then used Wolfram
// Alpha to output a function that fits to these points.
function _calculateScaleFactor(width: number) {
  return (
    3.63961 * 10 ** -10 * width ** 3 -
    1.348485 * 10 ** -6 * width ** 2 +
    1.751427 * 10 ** -3 * width +
    0.1817645
  );
}

export default function getQueryResultScalingDimensions(
  height: number,
  width: number,
): { scaleFactor: number, referenceHeight: number, referenceWidth: number } {
  const containerRatio = width / height;
  const scaleFactor = _calculateScaleFactor(width);
  // We use the scale factor to calculate the width that we should draw our
  // visualization at, before it gets scaled up/down by the factor.
  const referenceWidth = width / scaleFactor;
  // We use the ratio of the container's width to its height to calculate the
  // height that we should draw our visualization at.
  const referenceHeight = referenceWidth / containerRatio;
  return {
    scaleFactor,
    referenceHeight,
    referenceWidth,
  };
}
