// @flow

// Utility for rendering an on-screen element to a canvas.
// NOTE(stephen,toshi): Put this in a more appropriate folder since it is pretty
// generalized.
import Promise from 'bluebird';
import invariant from 'invariant';
import isVisible from 'true-visibility';
import svgAsPngLib, { svgAsDataUri } from 'save-svg-as-png';

import { VENDOR_SCRIPTS } from 'vendor/registry';

// HACK(stephen): Giant enormous hack! The horizontal bar graph uses a
// rotate(90) transformation on the root SVG element. When this rotation is
// applied to the serialized SVG that `saveSvgAsDataUri` produces, and then when
// we use this SVG string directly on an image element, part of the image will
// be cut off. This happens because the outer SVG in this case has a flipped
// width and height since the desired width/height *after* rotation should be
// correct. To fix this, we remove the transformation that is applied at the
// SVG level, fix the width/height values, and nest the child contents of the
// SVG inside a group that applies the transformation.
svgAsPngLib.__prepareSvg = svgAsPngLib.prepareSvg;
svgAsPngLib.prepareSvg = (el, options, done) => {
  const transformStr = el.getAttribute('transform');
  if (!transformStr || !transformStr.includes('rotate(90)')) {
    return svgAsPngLib.__prepareSvg(el, options, done);
  }
  return svgAsPngLib
    .__prepareSvg(el, options)
    .then(({ src, width, height }) => {
      let rewrittenSVGStr = src
        .replace(transformStr, '')
        .replace('viewBox', 'x-viewBox')
        .replace(`width="${width}"`, `width="${height}"`)
        .replace(`height="${height}"`, `height="${width}"`)
        .replace('<defs>', `<g transform="${transformStr}"><defs>`);
      rewrittenSVGStr = rewrittenSVGStr.substr(
        0,
        rewrittenSVGStr.lastIndexOf('</svg>'),
      );
      rewrittenSVGStr = `${rewrittenSVGStr}</g></svg>`;

      // Mimic behavior of the original `prepareSvg`.
      const output = { src: rewrittenSVGStr, height, width };
      if (typeof done === 'function') {
        done(output);
        return undefined;
      }
      return output;
    });
};

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
    if (curElt.parentElement) {
      curElt = curElt.parentElement;
      const overflowStyle = getComputedStyle(curElt).overflow;
      if (overflowStyle === 'hidden' || overflowStyle === 'scroll') {
        if (doesOverflow(eltCoords, curElt.getBoundingClientRect())) {
          return curElt;
        }
      }
    }

    break;
  }

  return undefined;
}

// Calculate the positioning within the source element that should be drawn
// to the canvas. If a bounding element exists, the source element will be
// cropped to the correct size to not overlap.
function getSourceBounds(eltRect, eltTransformation, boundingRect) {
  return {
    // prettier-ignore
    sx: (boundingRect.left - eltRect.left) + eltTransformation.x,
    // prettier-ignore
    sy: (boundingRect.top - eltRect.top) + eltTransformation.y,
    sWidth: boundingRect.width,
    sHeight: boundingRect.height,
  };
}

// Calculate where the element should be drawn on the canvas.
function getDestinationBounds(
  boundingRect: ClientRect,
  originRect: ClientRect,
) {
  const bounds = {
    dx: boundingRect.left - originRect.left,
    dy: boundingRect.top - originRect.top,
    dWidth: boundingRect.width,
    dHeight: boundingRect.height,
  };
  return bounds;
}

// Calculate the source and destination bounds that define how the specified
// element should be drawn on a canvas. This method determines if an element
// should be cropped when drawn to the canvas (like when a parent element has
// overflow: hidden set).
function getVisibleBounds(elt: Element, root: HTMLElement) {
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

// Create a style definition that will include all parent styles of the SVG
// root element. This ensures that styles applied on, for example, document.body
// are included (like default font-family).
// NOTE(stephen): Currently we only care about font related styles.
function calculateSVGRootStyle(svgRootElt: SVGSVGElement) {
  // Create a reference element that can be used to compute the styles that are
  // different on the root element vs a reference element that is not in the
  // DOM at that position.
  const svgReferenceElt = svgRootElt.ownerDocument.createElement('svg');

  // Copy the element attributes from the root element to the reference element
  // since this will reduce the number of properties being diffed.
  Array.from(svgRootElt.attributes).forEach(({ name }) => {
    const attrVal = svgRootElt.getAttribute(name);
    if (attrVal !== undefined && attrVal !== null) {
      svgReferenceElt.setAttribute(name, attrVal);
    }
  });

  const referenceStyle = window.getComputedStyle(svgReferenceElt);
  const currentStyle = window.getComputedStyle(svgRootElt);

  // Copy all font and text styles that are overriden.
  const styleLines = Array.from(currentStyle)
    .filter(
      key =>
        (key.includes('font') || key.includes('text')) &&
        referenceStyle.getPropertyValue(key) !==
          currentStyle.getPropertyValue(key),
    )
    .map(key => `${key}: ${currentStyle.getPropertyValue(key)};`);

  return styleLines.join('\n');
}

// Serialize an SVG element and render it onto an Image. The resolved promise
// returns the image element and the bounds needed for placing the image within
// a canvas.
function renderSVG(elt: SVGSVGElement, originElt: HTMLElement) {
  // If the SVG is not visible or it is nested inside a parent SVG, we do not
  // need to render it.
  if (!isVisible(elt) || elt.ownerSVGElement !== null) {
    return Promise.resolve(undefined);
  }

  // HACK(stephen): The save-svg-as-png library does *not* copy over styles
  // that are inherited into the output SVG image it builds internally. This is
  // most noticeable when font-family is not included since some text elements
  // might not have it defined inline. We calculate the root styles that need to
  // be applied and include them directly in the internal SVG that the library
  // builds.
  let addedStyle = false;
  const supplementalStyle = calculateSVGRootStyle(elt);
  function modifyCss(selectorText, cssText) {
    const styleLine = `${selectorText}{${cssText}}\n`;

    // Insert our supplemental styles at the top of the CSS style block in the
    // new SVG.
    if (!addedStyle) {
      addedStyle = true;
      return `svg{${supplementalStyle}}\n${styleLine}`;
    }
    return styleLine;
  }

  // HACK(stephen): Plotly has a really, really annoying "feature" where they
  // add a `data-unformatted` prop to text elements. This unformatted data will
  // contain the non-HTML-escaped text. If this text contains certain characters
  // (like < or >) it will produce an invalid SVG that cannot be parsed. We need
  // to remove these properties.
  // NOTE(stephen): This will mutate the element directly inside the SVG. If the
  // SVG element provided to `renderSVG` is reused, it will seem like the SVG
  // state magically changed with no warning. If someone relies on the
  // data-unformatted property, then things could potentially break. I am ok
  // with this since Plotly is the only one that uses it and it doesn't matter.
  Array.from(elt.querySelectorAll('*[data-unformatted]')).forEach(textElt => {
    // eslint-disable-next-line no-param-reassign
    delete textElt.dataset.unformatted;
  });

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
      modifyCss,
      encoderOptions: 1,
      excludeUnusedCss: true,
      // NOTE(sophie): Firefox has a bug where it does not define a default viewBox.
      left: elt.viewBox.baseVal?.x || 0,
      top: elt.viewBox.baseVal?.y || 0,
    };
    svgAsDataUri(elt, options, uri => {
      image.src = uri;
    });
  });
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
function ignoreElements(eltBeingExported: HTMLElement, eltToTest: HTMLElement) {
  const { head } = eltBeingExported.ownerDocument;

  return !(
    eltBeingExported.contains(eltToTest) ||
    eltToTest.contains(eltBeingExported) ||
    (head && head.contains(eltToTest))
  );
}

// Render the element onto a canvas and return a Promise that will resolve with
// the canvas element.
export function render2canvas(elt: HTMLElement): Promise<HTMLCanvasElement> {
  // Render SVG's separately from html2canvas since other libraries handle them
  // better.
  const svgElts = Array.from(elt.getElementsByTagName('svg'));
  const svgPromises = Promise.map(svgElts, svgElt => renderSVG(svgElt, elt));

  const { height, width } = elt.getBoundingClientRect();
  const resultSize = { width, height };

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

      window
        .html2canvas(elt, options)
        .then(resolve)
        .catch(reject);
    });
  });
}
