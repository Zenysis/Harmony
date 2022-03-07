// @flow
import { TIMESTAMP_GROUPING_ID } from 'models/core/QueryResultSpec/QueryResultGrouping';
import type {
  BandBound,
  BandSetting,
} from 'models/visualizations/LineGraph/LineGraphSettings';
import type {
  LineGraphLines,
  RawTimestamp,
} from 'models/visualizations/LineGraph/types';

type PlotlyLineShape = {
  connectgaps: boolean,
  fill?: string,
  fillcolor?: string,
  hoverinfo: string,
  legendgroup: string | void,
  line: { color: string } | void,
  mode: 'lines',
  name: string | void,
  opacity: number,
  showlegend: boolean,
  type: 'scatter',
  x: $ReadOnlyArray<string>,
  xaxis: 'x',
  y: $ReadOnlyArray<number | void>,
  yaxis: 'y' | 'y2',
};

type FullyDefinedBandSetting = {
  areaColor: string | void,
  areaLabel: string,
  id: string,
  lower: BandBound,
  upper: BandBound,
};

// Filter out any bands that will not result in a useful drawing.
function filterBands(
  bands: $ReadOnlyArray<BandSetting>,
): [$ReadOnlyArray<FullyDefinedBandSetting>, $ReadOnlySet<string>] {
  const fieldsToCalculate = new Set();
  const filteredBands = [];
  bands.forEach(({ areaColor, areaLabel, lower, upper }, idx) => {
    // Force the bands to be defined. If either the lower or upper is undefined,
    // set it to be the other band.
    const output = {
      areaColor,
      areaLabel,
      id: `band--${idx}`,
      lower: lower || upper,
      upper: upper || lower,
    };

    // If both are still undefined, we can just safely skip this bound.
    if (output.lower === undefined || output.upper === undefined) {
      return;
    }

    if (output.lower.type === 'field' || output.upper.type === 'field') {
      // If the lower band and upper band are referencing the same field, or
      // if the area color to shade between the two fields is undefined, we
      // can skip this band since there is nothing to draw.
      if (
        output.lower.type === 'field' &&
        output.upper.type === 'field' &&
        (areaColor === undefined ||
          output.lower.fieldId === output.upper.fieldId)
      ) {
        return;
      }
      if (output.lower.type === 'field') {
        fieldsToCalculate.add(output.lower.fieldId);
      }
      if (output.upper.type === 'field') {
        fieldsToCalculate.add(output.upper.fieldId);
      }
    }

    filteredBands.push(output);
  });

  // $FlowFixMe[incompatible-return]
  return [filteredBands, fieldsToCalculate];
}

// Build a mapping from field ID to an array containing each distinct lines'
// ordered values.
function buildFieldToLineValueMapping(
  lines: LineGraphLines,
  dates: $ReadOnlyArray<RawTimestamp>,
  fieldIds: $ReadOnlySet<string>,
): { +[fieldId: string]: $ReadOnlyArray<$ReadOnlyArray<number | void>>, ... } {
  const output = {};
  if (fieldIds.size === 0) {
    return output;
  }

  // Build a mapping from date to the index it is located at. This will allow
  // us to build the line data sorted by date *as we build the line*.
  const dateIndexMap = {};
  dates.forEach((date, idx) => {
    dateIndexMap[date] = idx;
  });

  lines.forEach(line => {
    const fieldData = {};
    line.forEach(dataPoint => {
      fieldIds.forEach(fieldId => {
        if (fieldData[fieldId] === undefined) {
          fieldData[fieldId] = new Array(dates.length);
        }
        const dateIdx = dateIndexMap[dataPoint[TIMESTAMP_GROUPING_ID]];
        fieldData[fieldId][dateIdx] = dataPoint[fieldId];
      });
    });
    fieldIds.forEach(fieldId => {
      if (output[fieldId] === undefined) {
        output[fieldId] = [];
      }
      output[fieldId].push(fieldData[fieldId]);
    });
  });

  return output;
}

export default function buildColoredBandLines(
  bands: $ReadOnlyArray<BandSetting>,
  dates: $ReadOnlyArray<RawTimestamp>,
  dateLabels: $ReadOnlyArray<string>,
  lines: LineGraphLines,
  y2AxisFieldIds: $ReadOnlyArray<string>,
): $ReadOnlyArray<PlotlyLineShape> {
  const [filteredBands, fieldsToCalculate] = filterBands(bands);
  const fieldToLines = buildFieldToLineValueMapping(
    lines,
    dates,
    fieldsToCalculate,
  );

  // Build a generator function that will produce a plotly line object for the
  // given index.
  function buildNextLineGenerator(
    bound: BandBound,
    id: string,
    areaColor: string | void,
    areaLabel: string | void,
  ): (idx: number) => PlotlyLineShape {
    // Only allow a legend value to be populated if there is a band area color
    // set and the label value exists.
    const allowLegend =
      areaColor !== undefined &&
      areaLabel !== undefined &&
      areaLabel.length > 0;

    const baseLine = {
      connectgaps: true,
      fill: areaColor !== undefined ? 'tonexty' : undefined,

      // NOTE(stephen): Force the fill color to have transparency by adjusting
      // the alpha directly on the color. There's no other way to do it,
      // unfortunately, since the `opacity` property only applies to the line.
      fillcolor: areaColor !== undefined ? `${areaColor}80` : undefined,
      hoverinfo: 'none',
      legendgroup: id,
      line: { color: '#ffffffff' },
      mode: 'lines',
      name: areaLabel,
      opacity: 0,
      showlegend: false,
      type: 'scatter',
      x: dateLabels,
      xaxis: 'x',
      y: [],
      yaxis: 'y',
    };

    if (bound.type === 'value') {
      if (bound.color !== undefined) {
        baseLine.line.color = bound.color;
        baseLine.opacity = 1;
      }
      if (bound.axis === 'y2Axis') {
        baseLine.yaxis = 'y2';
      }
      baseLine.showlegend = allowLegend;
      baseLine.y = dateLabels.map(() => bound.value);
      return () => baseLine;
    }

    const { fieldId } = bound;
    const fieldLineValues = fieldToLines[fieldId];
    if (y2AxisFieldIds.includes(fieldId)) {
      baseLine.yaxis = 'y2';
    }
    return (idx: number) => ({
      ...baseLine,
      // To avoid adding the legend item for every single line, only add it for
      // the first line
      showlegend: allowLegend && idx === 0,
      y: fieldLineValues[idx],
    });
  }

  const output = [];
  filteredBands.forEach(({ areaColor, areaLabel, id, lower, upper }) => {
    const getNextLowerLine = buildNextLineGenerator(lower, id);
    const getNextUpperLine = buildNextLineGenerator(
      upper,
      id,
      areaColor,
      areaLabel,
    );

    // Optimization: If both bound types are value, then we only need to add
    // two lines to the output.
    if (lower.type === 'value' && upper.type === 'value') {
      output.push(getNextLowerLine(0));
      output.push(getNextUpperLine(0));
      return;
    }

    lines.forEach((_, idx) => {
      output.push(getNextLowerLine(idx));
      output.push(getNextUpperLine(idx));
    });
  });

  return output;
}
