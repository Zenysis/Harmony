// @flow
import numeral from 'numeral';
import { localPoint } from '@vx/event';

// Certain vendor libraries have limitations that need to be worked around. This
// includes patches that have not been approved and merged into a release, and
// issues that we have fixed ourselves within our system.

/**
 * Plotly has a bug where if an ancestor element holding the Plotly
 * visualization has a `transform: scale` applied to it, then the hover event
 * handling code will calculate the x/y position of this event improperly. The
 * bug has been open for THREE YEARS.
 * https://github.com/plotly/plotly.js/issues/888
 */
export function patchPlotlyHoverEvent() {
  const hoverOriginal = window.Plotly.Fx.hover;

  /**
   * Calculate the x/y position of the input event in the SVG plot's local
   * coordinate system. If the input event is not a hover event on the actual
   * plot area, let Plotly handle it directly.
   */
  function patchEvent(event: mixed): mixed {
    // The event must be a MouseEvent on the first element in the drag layer.
    // Plotly uses the first element of the drag layer to capture all hover
    // events on the actual plot. Other drag elements exist in the drag layer,
    // but they seem to still work when the plot is transformed so we can ignore
    // them. We expect this drag element to be an SVG Rect element.
    if (!(event instanceof MouseEvent)) {
      return event;
    }

    // Check a few heuristics to ensure we are operating on the single plot
    // hover event that we care about.
    const { target } = event;
    if (
      !(
        target instanceof SVGRectElement &&
        target.classList.contains('drag') &&
        target.parentElement &&
        target.parentElement.firstChild === target
      )
    ) {
      return event;
    }

    // Convert the event coordinates into the local element's coordinate system.
    // This allows us to compensate for a `transform: scale` that is applied to
    // a parent element *outside the SVG*.
    // NOTE(stephen): Take advantage of how VX has already solved this issue and
    // we can just use their library.
    const eventLocalCoordinates = localPoint(event);
    const targetLocalCoordinates = target.getCTM();

    // NOTE(stephen): Probably can be an invariant, but since we're patching a
    // third-party library, lets just have the library deal with it.
    if (eventLocalCoordinates === null || targetLocalCoordinates === null) {
      return event;
    }

    // Finally, we need to shift the local coordinates based on any
    // transformation applied *within* the SVG.
    return {
      target,
      xpx: eventLocalCoordinates.x - targetLocalCoordinates.e,
      ypx: eventLocalCoordinates.y - targetLocalCoordinates.f,
    };
  }

  /**
   * Plotly also has a bug where the tooltip background is calculated off the
   * wrong coordinate system. Apply the inverse of the scale that is currently
   * affecting the plot to the tooltip backround so that it is the correct size.
   */
  function maybeScaleTooltipBackground(event: mixed) {
    if (!(event instanceof MouseEvent)) {
      return;
    }

    const { target } = event;
    const svgElement =
      target instanceof SVGRectElement ? target.ownerSVGElement : null;
    if (svgElement === null) {
      return;
    }

    const { a: scale } = svgElement.getScreenCTM() || { a: 1 };
    const { parentElement } = svgElement;

    // If no scale is being applied, then we don't need to modify the tooltip.
    if (scale === 1 || !parentElement) {
      return;
    }

    // Find all tooltips and apply an inversion of the scale applied to the SVG
    // since Plotly uses really terrible calculations to produce this.
    // NOTE(stephen): Plotly stores the hover layer as a completely separate
    // SVG, so we need to search from the parent div.
    const tooltipPaths = parentElement.querySelectorAll(
      '.hoverlayer .hovertext path',
    );
    const transform = `scale(${1 / scale})`;

    /* eslint-disable no-param-reassign */
    tooltipPaths.forEach(path => {
      path.style.transform = transform;
    });

    // Find all tooltip text containers and reposition them according to the
    // scaled coordinate system. The text font size needs to be changed by the
    // scaling value, and the entire text container needs to have the scale
    // inversion applied.
    // NOTE(stephen): This is the most reliable way to reposition the text
    // inside the hover tooltip since it is difficult to modify the x/y
    // attributes in a stable way.
    const textPaths = parentElement.querySelectorAll(
      '.hoverlayer .hovertext > text',
    );
    textPaths.forEach(text => {
      text.style.transform = transform;
      // NOTE(stephen): The font-size used here is 13px since this is a Plotly
      // constant. Need to hardcode instead of derive from the style since the
      // scale could continuously be applied on the same element and cause us
      // to write the incorrect font size.
      text.style.fontSize = `${13 * scale}px`;
    });
    /* eslint-enable no-param-reassign */
  }

  /**
   * Hook into Plotly's event handler and directly compute the x/y coordinates
   * of the hover event and pass this to Plotly. Luckily, they allow a user to
   * supply the coordinates in `{ xpx: number, ypx: number }` format.
   */
  function hoverPatched(gd: mixed, event: mixed, subplot: mixed): mixed {
    const patchedEvent = patchEvent(event);
    const output = hoverOriginal(gd, patchedEvent, subplot);
    maybeScaleTooltipBackground(event);
    return output;
  }

  window.Plotly.Fx.hover = hoverPatched;
}

// HACK(abby): This overrides D3's format function in align with the one in
// QueryResultSeries for specifically plotly visualizations (right now only
// line graph).
export const ZEN_GRAPH_FORMAT_LABEL = 'zenGraph-';

export function patchD3Format() {
  const formatOriginal = window.Plotly.d3.format;

  const formatPatched = specifier => {
    if (specifier && specifier.startsWith(ZEN_GRAPH_FORMAT_LABEL)) {
      const realSpecifier = specifier.slice(ZEN_GRAPH_FORMAT_LABEL.length);
      return value => numeral(value).format(realSpecifier);
    }
    return formatOriginal(specifier);
  };

  window.Plotly.d3.format = formatPatched;
}
