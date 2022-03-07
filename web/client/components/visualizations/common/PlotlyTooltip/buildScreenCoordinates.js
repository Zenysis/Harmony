// @flow

type PlotlyAxis = {
  +c2p: number => number,
};

type CartesianPlot = {
  +plot: {
    node: () => SVGGraphicsElement,
  },
  +xaxis: PlotlyAxis,
  +yaxis: PlotlyAxis,
};

export type PlotlyElementProperties = {
  +_fullLayout?: {
    +_plots: {
      +xy?: CartesianPlot,
      +xy2?: CartesianPlot,
    },
  },
  ...
};

const EMPTY_COORDINATES = { x: 0, y: 0 };

/**
 * For a given x/y coordinate in the Plotly plot, build the corresponding
 * screen coordinates that indicate where that x/y coordinate lives in the
 * browser.
 */
export default function buildScreenCoordinates(
  plotContainer: HTMLDivElement & PlotlyElementProperties,
  x: number,
  y: number,
  yAxis: 'y1Axis' | 'y2Axis',
): { x: number, y: number } {
  const { _fullLayout } = plotContainer;
  if (_fullLayout === undefined) {
    return EMPTY_COORDINATES;
  }

  const cartesianPlot =
    yAxis === 'y1Axis' ? _fullLayout._plots.xy : _fullLayout._plots.xy2;

  if (cartesianPlot === undefined) {
    return EMPTY_COORDINATES;
  }

  const node = cartesianPlot.plot.node();
  if (!node.ownerSVGElement) {
    return EMPTY_COORDINATES;
  }

  const point = node.ownerSVGElement.createSVGPoint();
  const screenCTM = node.getScreenCTM();
  if (screenCTM === null) {
    return EMPTY_COORDINATES;
  }

  // The screen coordinates produced do not account for scrolling (they are
  // just the coordinates within the viewable window area with point 0,0 being
  // at the top left). Add in scrolling position so we can get the absolute
  // coordinates.
  screenCTM.e += window.scrollX;
  screenCTM.f += window.scrollY;
  point.x = cartesianPlot.xaxis.c2p(x);
  point.y = cartesianPlot.yaxis.c2p(y);
  const transformation = point.matrixTransform(screenCTM);
  return {
    x: transformation.x,
    y: transformation.y,
  };
}
