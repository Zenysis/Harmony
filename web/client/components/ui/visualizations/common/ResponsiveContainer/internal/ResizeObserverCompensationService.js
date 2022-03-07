// @flow
import ResizeObserver from 'resize-observer-polyfill';

const RECT_SIZE = 10;
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Detect when the browser zoom level has affected the sizing of SVG elements
 * that is reported by ResizeObserver. On some browsers (Chrome based), the
 * ResizeObserver will report the size after applying a zoom scale to the
 * element dimensions. This is incredibly annoying. If the browser's zoom level
 * is 125%, then the ResizeObserver's contentRect height/width will be reported
 * as height / 1.25. This is incorrect and throws off calculations within the
 * ResponsiveContainer.
 *
 * NOTE(stephen): This was almost a really cool service that could reliably
 * detect browser zoom level (which is apparently really hard to actually
 * detect!). However, Firefox doesn't have this bug so here we are. Maybe one
 * day I'll fulfill my dream (?) of creating a reliable
 * BrowserZoomDetectionService.
 */
class ResizeObserverCompensationService {
  lastRecordedSize: number = -1;

  constructor() {
    // NOTE(stephen): This should never be possible, however an invariant is too
    // heavy for this utility.
    const documentBody = document.body;
    if (!documentBody) {
      return;
    }

    // Create an invisible SVG to hold our rect element.
    const svgElement = document.createElementNS(SVG_NS, 'svg');
    svgElement.setAttribute('height', '0');
    svgElement.setAttribute('width', '0');
    svgElement.setAttribute('id', '__rocs');
    svgElement.setAttribute('style', 'position: absolute');

    // This rect element will be watched and any resize chang
    const rectElement = document.createElementNS(SVG_NS, 'rect');
    rectElement.setAttribute('height', `${RECT_SIZE}`);
    rectElement.setAttribute('width', `${RECT_SIZE}`);
    rectElement.setAttribute('fill', 'transparent');
    svgElement.appendChild(rectElement);

    // Store the reported rect size when it changes. This will allow us to
    // calculate the browser ratio by taking the expected rect size and
    // comparing it to the reported rect size. When the browser zoom is at 100%,
    // or when the browser is *not Chrome*, then the reported size will equal
    // the expected size. When it is not equal, the difference will be the
    // browser zoom level.
    const onResize = (entries: $ReadOnlyArray<ResizeObserverEntry> = []) => {
      this.lastRecordedSize = entries[0].contentRect.height;
    };

    let offset = 0;
    let mediaQueryList;
    const triggerResize = () => {
      // Update the rect element's width to trigger a resize event that will be
      // captured by the ResizeObserver.
      offset = (offset + 1) % 2;
      rectElement.setAttribute('width', `${RECT_SIZE + offset}`);

      // We can use a media query to detect when the browser zoom has changed.
      // When the user changes the browser zoom, the devicePixelRatio will be
      // updated.
      if (mediaQueryList !== undefined) {
        mediaQueryList.removeListener(triggerResize);
      }
      mediaQueryList = window.matchMedia(
        `(resolution: ${window.devicePixelRatio}dppx)`,
      );

      // Depending on the browser, we have to register the event in a different
      // way.
      if (mediaQueryList.addEventListener !== undefined) {
        mediaQueryList.addEventListener('change', triggerResize);
      } else {
        mediaQueryList.addListener(triggerResize);
      }
    };

    // $FlowIssue[incompatible-call] - Flow + resize-observer-polyfill types conflict.
    const observer = new ResizeObserver(onResize);
    documentBody.appendChild(svgElement);
    observer.observe(rectElement);

    // Trigger the first resize to set up the media query listeners and to
    // record the initial size of the rect.
    triggerResize();
  }

  /**
   * Get the scale that a ResizeObserverEntry's `contentRect` should be adjusted
   * by for SVG elements. On Chrome, if the user has a browser zoom level
   * applied, then this scale will not equal 1. On all other browsers (who
   * correctly implement ResizeObserver *and* SVG scaling) this will be 1.
   */
  getSVGSizeScale: () => number = () => {
    if (this.lastRecordedSize === -1) {
      return 1;
    }

    return RECT_SIZE / this.lastRecordedSize;
  };
}

export default (new ResizeObserverCompensationService(): ResizeObserverCompensationService);
