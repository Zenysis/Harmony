// @flow
import calculateLabelPosition from 'components/ui/visualizations/PieChart/internal/calculateLabelPosition';
import { round } from 'util/numberUtil';
import type {
  ArcData,
  ArcPath,
  LabelData,
  LabelPosition,
} from 'components/ui/visualizations/PieChart/types';

// Build a percent string from the raw percentage value supplied.
function formatPercent(value: number, decimals: number = 0): string {
  if (value <= 0.01) {
    return '<1%';
  }

  const [integerStr, decimalStr] = (value * 100).toFixed(decimals).split('.');
  if (decimalStr !== undefined) {
    const decimal = Number.parseInt(decimalStr, 10);
    if (decimal > 0) {
      return `${integerStr}.${decimal}%`;
    }
  }
  return `${integerStr}%`;
}

function formatLabel(
  value: number,
  total: number,
  displayLabelType: 'percent' | 'raw' | 'both',
): string {
  const formattedRaw = round(value, 2).toString();
  if (displayLabelType === 'raw') {
    return formattedRaw;
  }
  const formattedPercent = formatPercent(value / total);
  if (displayLabelType === 'percent') {
    return formattedPercent;
  }
  return `${formattedRaw} (${formattedPercent})`;
}

// Detect if any part of the text boxes overlap.
export function labelsCollide(
  positionA: LabelPosition,
  positionB: LabelPosition,
): boolean {
  return (
    positionA.left >= positionB.left &&
    positionA.left <= positionB.right &&
    positionA.top >= positionB.top &&
    positionA.top <= positionB.bottom
  );
}

/** Compute the position that each pie segment's label should be placed. */
export default function buildSegmentLabelData(
  arcs: $ReadOnlyArray<ArcData>,
  path: ArcPath,
  fontSize: number,
  displayLabelType: 'percent' | 'raw' | 'both',
  labelDistance: number,
): $ReadOnlyArray<LabelData> {
  // Calculate the total value for the pie chart.
  const pieTotal = arcs.reduce(
    (acc, arc) =>
      // NOTE(stephen): D3 ignores negative values inside pie charts.
      arc.value >= 0 ? acc + arc.value : acc,
    0,
  );

  // Place the highlighted segment labels outside the center of the pie segment.
  // Prevent collisions between labels.
  const outerRadius = path.outerRadius()();
  return arcs.map(({ data, endAngle, startAngle, value }) => {
    const displayValue = formatLabel(value, pieTotal, displayLabelType);

    const position = calculateLabelPosition(
      displayValue,
      fontSize,
      startAngle,
      endAngle,
      outerRadius,
      labelDistance,
    );

    return {
      key: data.key,
      displayValue,
      position,
    };
  });
}
