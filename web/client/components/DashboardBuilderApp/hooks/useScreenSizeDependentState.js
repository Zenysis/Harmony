// @flow
import useWindowSize from 'lib/hooks/useWindowSize';

const HEIGHT_THRESHOLD = 500;
const WIDTH_THRESHOLD = 780;
const MIN_SCREEN_SIZE = 200;

/**
 * Provides certain dashboard-level settings that are dependent on the screen
 * size. Returns whether the dashboard should be in "collapsed" mode (AKA mobile
 * view) and whether the screen is too small to effectively render the dashboard
 * at all.
 */
export default function useScreenSizeDependentState(): [
  boolean, // collapse
  boolean, // screenTooSmall
] {
  const { height, width } = useWindowSize();
  const collapse = height < HEIGHT_THRESHOLD || width < WIDTH_THRESHOLD;
  const screenTooSmall = height < MIN_SCREEN_SIZE || width < MIN_SCREEN_SIZE;
  return [collapse, screenTooSmall];
}
