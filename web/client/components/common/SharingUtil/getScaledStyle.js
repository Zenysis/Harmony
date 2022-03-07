// @flow

import type { Size } from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/ShareQueryModal/types';
import type { StyleObject } from 'types/jsCore';

// A trick we use to properly resize the preview image while respecting
// the top and bottom/left and right padding of the BaseModal component
const MODAL_PADDING = 2 * 30;

/**
 * This function is responsible for calculating the correct scale factor
 * we should use to manipulate the preview of the image that the user sees
 * when downloading as an image.
 * TODO(stephen.byarugaba): improve this function so that it can somehow be
 * shared with the GIS version of the image preview, instead of two slightly
 * different copies
 */
export default function getScaledStyle(
  imageHeight: number | string,
  imageWidth: number | string,
  containerSize: Size,
): StyleObject | void {
  const { height, width } = containerSize;
  // These values are not useful, so we discard them
  if (height === 0 || width === 0) {
    return undefined;
  }

  // // The width of the modal, not including the padding. This represents the
  // // width of the space that the preview image has to render itself in.
  const containerWidth = width - MODAL_PADDING;

  // // The height of the modal, not including the modal's padding, and any
  // // other elements that surround the preview image and contribute to the
  // // modal's height (with their margins included). This represents the height
  // // of the space that the preview image has to render itself in.
  const containerHeight = height - MODAL_PADDING;

  // Return the smallest possible scaling that fits the image within
  // our modal, but never scale up!
  return {
    position: 'absolute',
    transform: `scale(${Math.min(
      containerWidth / Number(imageWidth),
      containerHeight / Number(imageHeight),
    )})`,
  };
}
