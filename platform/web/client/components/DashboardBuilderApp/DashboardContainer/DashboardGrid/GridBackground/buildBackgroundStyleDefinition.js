// @flow

type BackgroundStyleDefinition = {
  backgroundImage: string,
  backgroundPosition: string,
  backgroundRepeat: string,
  backgroundSize: string,
};

/**
 * Merge multiple background definitions into a single background definition
 * that can be used in a style. The order that backgrounds are supplied to the
 * will match the order rendered in the merged background. The stacking order
 * of the backgrounds matches the CSS style specification which states that
 * the earlier background images will be drawn *on top* of the later background
 * images. (You can think of the `backgroundOrder` as a reverse stacking order.)
 */
export function buildMergedBackgroundStyleDefinition(
  backgroundOrder: $ReadOnlyArray<BackgroundStyleDefinition>,
): BackgroundStyleDefinition {
  return {
    backgroundImage: backgroundOrder.map(b => b.backgroundImage).join(','),
    backgroundPosition: backgroundOrder
      .map(b => b.backgroundPosition)
      .join(','),
    backgroundRepeat: backgroundOrder.map(b => b.backgroundRepeat).join(','),
    backgroundSize: backgroundOrder.map(b => b.backgroundSize).join(','),
  };
}

/**
 * Package the individual pieces of a background style definition into a simple
 * structure.
 */
export default function buildBackgroundStyleDefinition(
  backgroundImage: string,
  backgroundPosition: string,
  backgroundSize: string,
  backgroundRepeat: string = 'no-repeat',
): BackgroundStyleDefinition {
  return {
    backgroundImage,
    backgroundPosition,
    backgroundRepeat,
    backgroundSize,
  };
}
