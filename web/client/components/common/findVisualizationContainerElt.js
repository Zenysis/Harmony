// @flow

// Find the visualization container element reference so that it can be used
// by the download image and canvas creation utilities. If the element cannot
// be found, return undefined.
export default function findVisualizationContainerElt(ref: {
  +current: ?HTMLElement, ...
}): HTMLElement | void {
  const { current } = ref;
  if (!current) {
    return undefined;
  }

  const queryResultViewElt = current.closest('.download-image-current-size');
  if (!queryResultViewElt) {
    return undefined;
  }

  const containerElements = queryResultViewElt.getElementsByClassName(
    'visualization-container',
  );

  // If multiple viz containers are found, we don't know what to do.
  if (containerElements.length !== 1) {
    return undefined;
  }

  return containerElements[0];
}
