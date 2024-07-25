// @flow

/** Generate the speed in milliseconds that the timeline should play at */
export default function buildPlaybackSpeed(
  speedFactor: 'quarter' | 'half' | 'normal' | 'double' | 'quadruple',
  initialSpeed: number,
): number {
  switch (speedFactor) {
    case 'quarter':
      return initialSpeed * 4;
    case 'half':
      return initialSpeed * 2;
    case 'normal':
      return initialSpeed;
    case 'double':
      return initialSpeed * 0.5;
    case 'quadruple':
      return initialSpeed * 0.25;
    default:
      (speedFactor: empty);
      return initialSpeed;
  }
}
