// @flow

// Find the visualization container element reference so that it can be used
// by the download image and canvas creation utilities. If the element cannot
// be found, return undefined.
export function findVisualizationContainerElt(
  ref: $RefObject<any>,
): HTMLDivElement | void {
  const { current } = ref;
  if (!current) {
    return undefined;
  }

  const queryResultViewElt = current.closest('.query-result-view');
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
