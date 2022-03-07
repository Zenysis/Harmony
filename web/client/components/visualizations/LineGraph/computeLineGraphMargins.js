// @flow
import { getStringWidth } from '@vx/text';

type PlotlyFontConfig = {
  +family: string,
  +size: number,
  ...
};

type PlotlyAxisLayout = {
  +tickangle: number,
  +tickfont: PlotlyFontConfig,
  +title: string,
  +titlefont: PlotlyFontConfig,

  // Axis properties that are only supplied for some axes types.
  +range?: [?number, ?number],
  +tickformat?: string | void,
  +tickvals?: $ReadOnlyArray<string>,
  ...
};

// The Plotly layout shape that we care about for computing margins.
type PlotlyLayoutShape = {
  +xaxis: PlotlyAxisLayout,
  +yaxis: PlotlyAxisLayout | void,
  +yaxis2: PlotlyAxisLayout | void,
  ...
};

type PlotlyDataPointShape = {
  +y: $ReadOnlyArray<?number>,
  +yaxis: 'y' | 'y2',
  ...
};

function computeTitleHeight(axis: PlotlyAxisLayout | void): number {
  if (axis === undefined || axis.title.trim().length === 0) {
    return 0;
  }

  // NOTE(stephen): Including a little extra padding on top of the title font
  // size to make sure we the title is not directly up against the axis labels.
  return axis.titlefont.size + 5;
}

/** Calculate the height in pixels that the x-axis will use. */
function computeXAxisHeight(xAxis: PlotlyAxisLayout): number {
  // If there is a x-axis title being shown, we need to include space for it
  // in the axis height calculated.
  const titleHeight = computeTitleHeight(xAxis);
  if (xAxis.tickvals === undefined || xAxis.tickvals.length === 0) {
    return titleHeight;
  }

  // If the ticks are not rotated, we can easily calculate the height based on
  // just the font size.
  if (xAxis.tickangle === 0) {
    return xAxis.tickfont.size * 1.2 + titleHeight;
  }

  // Find the longest tick values that will be shown.
  const { values } = xAxis.tickvals.reduce(
    (acc, val) => {
      // NOTE(stephen): Need to remove any spacing on either side of the value
      // since Plotly will automatically do that for us.
      const cleanValue = val.trim();
      const { length } = cleanValue;
      if (length > acc.maxLength) {
        return {
          maxLength: length,
          values: [cleanValue],
        };
      }
      if (length === acc.maxLength) {
        acc.values.push(cleanValue);
      }
      return acc;
    },
    { maxLength: 0, values: [] },
  );

  const textStyle = {
    fontFamily: xAxis.tickfont.family,
    fontSize: `${xAxis.tickfont.size}px`,
  };
  // Find the longest string that will be displayed on the x-axis.
  const maxTextLength = values.reduce(
    (curMax, val) => Math.max(curMax, getStringWidth(val, textStyle)),
    0,
  );

  // Calculate the vertical height this label will take up after rotation.
  // NOTE(stephen): Need to include the font size in the calculation since it
  // will cause our hypotenuse to be longer.
  const hypotenuse = maxTextLength + xAxis.tickfont.size;
  return Math.ceil(
    hypotenuse * Math.sin((xAxis.tickangle * Math.PI) / 180) + titleHeight,
  );
}

// Build a default range [min, max] for the given y-axis based on the range
// potentially specified by the user. If the user has directly provided the
// range the axis should use, mark it as `fixed`.
function getDefaultYAxisRange(
  yAxis: PlotlyAxisLayout | void,
): { fixed: boolean, range: [number, number] } {
  const { range } = yAxis || {};
  if (
    range === undefined ||
    !Number.isFinite(range[0]) ||
    !Number.isFinite(range[1])
  ) {
    return { fixed: false, range: [0, 0] };
  }

  // NOTE(stephen): Flow cannot correctly refine a numeric type using
  // Number.isFinite so we are suppressing the error.
  // $FlowIssue[incompatible-return]
  return { fixed: true, range };
}

function computeYAxisWidth(
  yAxis: PlotlyAxisLayout | void,
  range: [number, number],
): number {
  if (yAxis === undefined) {
    return 0;
  }

  // NOTE(stephen): Plotly will draw the y-axis title rotated 90 degrees, so we
  // are safe using the title height here instead of its width.
  const titleSize = computeTitleHeight(yAxis);
  const textStyle = {
    fontFamily: yAxis.tickfont.family,
    fontSize: `${yAxis.tickfont.size}px`,
  };

  // In the case a label formatter is not user selected, try to estimate what the
  // longest y-axis label will be. This is difficult since Plotly does not expose
  // how the tick values will be built to the user. For now, just add a few extra
  // decimals to each value so that we can cover the non-integer case.
  let minText = '';
  let maxText = '';
  if (!yAxis?.tickformat) {
    minText = Math.floor(range[0]).toFixed(3);
    maxText = Math.ceil(range[1]).toFixed(3);
  } else {
    minText = window.Plotly.d3.format(yAxis.tickformat)(range[0]);
    maxText = window.Plotly.d3.format(yAxis.tickformat)(range[1]);
  }
  const textValue = minText.length > maxText.length ? minText : maxText;
  return Math.ceil(getStringWidth(textValue, textStyle) + titleSize);
}

export default function computeLineGraphMargins(
  layout: PlotlyLayoutShape,
  data: $ReadOnlyArray<PlotlyDataPointShape>,
): { b: number, l: number, r: number, t: number } {
  // Find the range of values each y-axis will cover.
  const yAxisRange = {
    y1Axis: getDefaultYAxisRange(layout.yaxis),
    y2Axis: getDefaultYAxisRange(layout.yaxis2),
  };
  data.forEach(({ y, yaxis }) => {
    const axisInfo = yaxis === 'y' ? yAxisRange.y1Axis : yAxisRange.y2Axis;
    if (!axisInfo.fixed) {
      y.forEach(val => {
        if (val !== null && val !== undefined) {
          const axisRange = axisInfo.range;
          axisRange[0] = Math.min(axisRange[0], val);
          axisRange[1] = Math.max(axisRange[1], val);
        }
      });
    }
  });

  const axesSizes = {
    xAxis: computeXAxisHeight(layout.xaxis),
    y1Axis: computeYAxisWidth(layout.yaxis, yAxisRange.y1Axis.range),
    y2Axis: computeYAxisWidth(layout.yaxis2, yAxisRange.y2Axis.range),
  };

  return {
    b: axesSizes.xAxis + 5,
    l: axesSizes.y1Axis > 0 ? axesSizes.y1Axis + 5 : 0,
    r: axesSizes.y2Axis > 0 ? axesSizes.y2Axis + 5 : 0,
    t: 5,
  };
}
