// Utility for rendering an on-screen element to a canvas.
// NOTE(stephen,toshi): Put this in a more appropriate folder since it is pretty
// generalized.
import Promise from 'bluebird';
import invariant from 'invariant';
import isVisible from 'true-visibility';
import { svgAsDataUri } from 'save-svg-as-png';

import { VENDOR_SCRIPTS } from 'vendor/registry';

// Compute the x/y positioning that has been applied to an element via
// transforms.
function get2dTransformation(elt) {
  const output = {
    x: 0,
    y: 0,
  };

  // Find the transformation matrix applied to this element.
  const computedStyle = elt.ownerDocument.defaultView.getComputedStyle(elt);
  const match = computedStyle.transform.match(/^matrix(3d)?\((.+?)\)$/);
  if (!match || !match[2]) {
    return output;
  }

  const values = match[2]
    .replace(' ', '')
    .split(',')
    .map(parseFloat);
  // Extract different values if matrix3d was applied vs a 2d matrix
  const xIndex = match[1] ? 12 : 4;
  output.x += values[xIndex];
  output.y += values[xIndex + 1];
  return output;
}

// Determine whether the input element overflows the bounds of its ancestor.
function doesOverflow(eltCoords, ancestorCoords) {
  return (
    eltCoords.left < ancestorCoords.left ||
    eltCoords.right > ancestorCoords.right ||
    eltCoords.top < ancestorCoords.top ||
    eltCoords.bottom > ancestorCoords.bottom
  );
}

// Find the first element, if it exists, between the input element and the root
// that causes the input element to overflow.
function findBoundingAncestor(elt, root) {
  invariant(root.contains(elt), 'Element must be a descendent of the root.');

  const { getComputedStyle } = elt.ownerDocument.defaultView;
  const eltCoords = elt.getBoundingClientRect();
  let curElt = elt;
  while (!curElt.isSameNode(root)) {
    curElt = curElt.parentElement;
    const overflowStyle = getComputedStyle(curElt).overflow;
    if (overflowStyle === 'hidden' || overflowStyle === 'scroll') {
      if (doesOverflow(eltCoords, curElt.getBoundingClientRect())) {
        return curElt;
      }
    }
  }

  return undefined;
}

// Calculate the positioning within the source element that should be drawn
// to the canvas. If a bounding element exists, the source element will be
// cropped to the correct size to not overlap.
function getSourceBounds(eltRect, eltTransformation, boundingRect) {
  return {
    // prettier-ignore
    sx: (boundingRect.x - eltRect.x) + eltTransformation.x,
    // prettier-ignore
    sy: (boundingRect.y - eltRect.y) + eltTransformation.y,
    sWidth: boundingRect.width,
    sHeight: boundingRect.height,
  };
}

// Calculate where the element should be drawn on the canvas.
function getDestinationBounds(boundingRect, originRect) {
  const bounds = {
    dx: boundingRect.x - originRect.x,
    dy: boundingRect.y - originRect.y,
    dWidth: boundingRect.width,
    dHeight: boundingRect.height,
  };
  return bounds;
}

// Calculate the source and destination bounds that define how the specified
// element should be drawn on a canvas. This method determines if an element
// should be cropped when drawn to the canvas (like when a parent element has
// overflow: hidden set).
function getVisibleBounds(elt, root) {
  // Find the parent element that causes part of this element to be hidden. If
  // no element exists, use the current element as the bounds.
  const boundingElt = findBoundingAncestor(elt, root) || elt;
  const originRect = root.getBoundingClientRect();
  const eltRect = elt.getBoundingClientRect();
  const boundingRect = boundingElt.getBoundingClientRect();
  const eltTransformation = get2dTransformation(elt);

  const sourceBounds = getSourceBounds(
    eltRect,
    eltTransformation,
    boundingRect,
  );
  const destinationBounds = getDestinationBounds(boundingRect, originRect);
  return { ...sourceBounds, ...destinationBounds };
}

// Serialize an SVG element and render it onto an Image. The resolved promise
// returns the image element and the bounds needed for placing the image within
// a canvas.
function renderSVG(elt, originElt) {
  // If the SVG is not visible or it is nested inside a parent SVG, we do not
  // need to render it.
  if (!isVisible(elt) || elt.ownerSVGElement !== null) {
    return Promise.resolve(undefined);
  }

  return new Promise((resolve, reject) => {
    const bounds = getVisibleBounds(elt, originElt);
    const image = new Image();
    const result = { bounds, image };
    image.onload = () => {
      resolve(result);
    };
    image.onerror = e => {
      console.error(e); // eslint-disable-line no-console
      reject();
    };

    // NOTE(stephen): Need to preserve the viewBox settings when serializing the
    // SVG. The library doesn't automatically read them from the element.
    const options = {
      left: elt.viewBox.baseVal.x,
      top: elt.viewBox.baseVal.y,
    };
    svgAsDataUri(elt, options, uri => {
      image.src = uri;
    });
  });
}

// Scale the provided value and preserve the unit system it uses.
function _applyScale(value, scale) {
  if (!value || scale === 1) {
    return value;
  }

  return `calc(${value} * ${scale})`;
}

// Convert the translate3d style of the given element into absolute coordinates.
// Apply any scaling factor to the element after updating the transformation.
function _convertToAbsoluteAndScale(elt, scale = 1) {
  const { height, width, transform } = elt.style;

  /* eslint-disable no-param-reassign */
  if (transform.includes('translate3d')) {
    // Parse the translate3d string and extract the absolute x and y positions.
    const match = transform.match(/translate3d\((.+?),(.+?),.+?\)/);
    const x = match[1];
    const y = match[2];

    // Remove the the transform applied to the element.
    elt.style.transform = '';
    // Absolutely position the element based on the translate3d values and the
    // provided scaling factor.
    elt.style.left = _applyScale(x, scale);
    elt.style.top = _applyScale(y, scale);
  }

  // If height or width are directly set, rescale them based on the provided
  // scaling factor.
  // NOTE(stephen): This will not work with css-provided height/width. Luckily,
  // leaflet uses styles to set the sizes, so this should be ok.
  if ((height || width) && scale !== 1) {
    elt.style.height = _applyScale(height, scale);
    elt.style.width = _applyScale(width, scale);
  }
  /* eslint-enable no-param-reassign */
}

// Extract the scaling factor applied to the element. Default is 1 (not scaled).
function _extractScale(elt) {
  const match = elt.style.transform.match(/scale\((.+?)\)/);
  if (!match) {
    return 1;
  }

  return Number.parseFloat(match[1]);
}

// Fix leaflet tile positioning since html2canvas does not handle translate3d
// clipping or scaling properly.
function _convertLeafletImagePositioning(cloneDocument) {
  const mapPaneElts = cloneDocument.getElementsByClassName('leaflet-map-pane');
  if (mapPaneElts.length === 0) {
    return;
  }

  // Leaflet positions image tiles by setting a translation on the image tile,
  // the tile container, and the map pane elements.
  for (let i = 0; i < mapPaneElts.length; i++) {
    // The mapPaneElts handle transformations related to panning.
    const mapPaneElt = mapPaneElts[i];
    _convertToAbsoluteAndScale(mapPaneElt);

    // The tileContainerElts handle transformations related to zooming.
    const tileContainerElts = mapPaneElt.getElementsByClassName(
      'leaflet-tile-container',
    );
    for (let j = 0; j < tileContainerElts.length; j++) {
      const tileContainerElt = tileContainerElts[j];
      // Store any zoom scale applied before converting to absolute position.
      const scale = _extractScale(tileContainerElt);
      _convertToAbsoluteAndScale(tileContainerElt);

      // The imageElts handle positioning of a map tile within the pane.
      // Convert the image elements to absolute positioning and apply any
      // scaling factor that exists.
      const imageElts = tileContainerElt.getElementsByClassName('leaflet-tile');
      for (let k = 0; k < imageElts.length; k++) {
        _convertToAbsoluteAndScale(imageElts[k], scale);
      }
    }
  }
}

function _replaceSVGs(cloneDocument, svgResults) {
  const svgElts = Array.from(cloneDocument.getElementsByTagName('svg'));
  svgElts.forEach((svgElt, idx) => {
    // If the SVG element is nested inside a parent SVG, we can ignore it. When
    // the parent SVG is replaced, the child will also be replaced.
    if (svgElt.ownerSVGElement !== null) {
      return;
    }

    // If no SVG result is produced, we do not need to draw this SVG at all.
    // This could be because the SVG was not visible (it could have been only
    // visible when the user hovers over it), or because it is nested inside a
    // parent SVG.
    /* eslint-disable no-param-reassign */
    const svgResult = svgResults[idx];
    if (svgResult === undefined) {
      svgElt.outerHTML = '';
      return;
    }

    // Replace the SVG element completely with the Image element we have
    // rendered. Copy any classes over so that the image is positioned properly.
    const { image } = svgResult;
    image.className = svgElt.className.baseVal;
    svgElt.outerHTML = image.outerHTML;
    /* eslint-enable no-param-reassign */
  });
}

// HACK(stephen): The html2canvas library does not detect when fonts have
// finished loading within the iframe. This can sometimes cause rendered fonts
// to have an invalid width calculated, resulting in compressed and ugly text.
// If the user's browser supports the experimental Font Loading API, then we
// can return that promise to html2canvas's onclone method to force it to wait
// for fonts to finish loading.
// NOTE(stephen): This relies on an undocumented feature of html2canvas's
// onclone support. onclone is called within a Promise chain, and its return
// value is passed along. The documented signature is:
// onclone?: Document => void
// but it is used like this:
// .then(() => onclone(documentClone)).then(() => result)
function _waitForFontLoad(cloneDocument) {
  if (!cloneDocument.fonts || !cloneDocument.fonts.ready) {
    return Promise.resolve();
  }

  return cloneDocument.fonts.ready;
}

// Apply special overrides to the cloned document before it is parsed by
// html2canvas. Replace all visible SVG elements with our rendered version since
// html2canvas has poor support for SVGs.
function onClone(cloneDocument, svgPromises, { height, width }) {
  const { body } = cloneDocument;
  // Add the html2canvas class so we can distinguish when elements are rendered
  // in the canvas document in CSS.
  body.className += ' html2canvas';

  // Manually set the height/width of the cloned document since html2canvas has
  // buggy support for this when it is passed as an option.
  body.style = `height: ${height}px; width: ${width}px;`;
  _convertLeafletImagePositioning(cloneDocument);

  return svgPromises
    .then(svgResults => _replaceSVGs(cloneDocument, svgResults))
    .then(() => _waitForFontLoad(cloneDocument));
}

// html2canvas by default will copy all elements from the DOM into a new iframe.
// This is incredibly inefficient but is done because the library doesn't know
// if an absolutely positioned element is overlaying the element being exported.
// However, we do. Only allow elements that are parents or children of the
// element being captured to be included. Also include everything in the head
// so that styles are loaded.
function ignoreElements(eltBeingExported, eltToTest) {
  const { head } = eltBeingExported.ownerDocument;
  return !(
    eltBeingExported.contains(eltToTest) ||
    eltToTest.contains(eltBeingExported) ||
    head.contains(eltToTest)
  );
}

// Render the element onto a canvas and return a Promise that will resolve with
// the canvas element.
export function render2canvas(elt, size = undefined) {
  // Render SVG's separately from html2canvas since other libraries handle them
  // better.
  const svgElts = Array.from(elt.getElementsByTagName('svg'));
  const svgPromises = Promise.map(svgElts, svgElt => renderSVG(svgElt, elt));

  const resultSize = { ...size };
  if (size === undefined) {
    const { height, width } = elt.getBoundingClientRect();
    resultSize.height = height;
    resultSize.width = width;
  }

  return new Promise((resolve, reject) => {
    VENDOR_SCRIPTS.html2canvas.load().then(() => {
      const options = {
        logging: false,
        onclone: cloneDocument =>
          onClone(cloneDocument, svgPromises, resultSize),
        ignoreElements: eltToTest => ignoreElements(elt, eltToTest),

        // The canvas should be drawn with a scale of 1 so that the size of the
        // element in CSS pixels is the true size of the output image.
        scale: 1,

        // Enable useCORS so that we can include embedded images
        // (like map tiles) in the canvas.
        useCORS: true,
      };

      html2canvas(elt, options)
        .then(resolve)
        .catch(reject);
    });
  });
}
