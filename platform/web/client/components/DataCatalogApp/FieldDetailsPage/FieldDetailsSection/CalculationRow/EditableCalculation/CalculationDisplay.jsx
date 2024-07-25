// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import { CALCULATION_DISPLAY_NAMES } from 'models/core/wip/Calculation/registry';
import { getFullDimensionName } from 'models/core/wip/Dimension';
import type { Calculation } from 'models/core/wip/Calculation/types';

type Props = {
  calculation: Calculation,
};

const TEXT_DIVIDER = (
  <div className="dc-editable-calculation-display__text-divider">|</div>
);

function renderCalculationDetails(
  calculationName: string,
  details: $ReadOnlyArray<[string, string | number]>,
) {
  if (details.length === 0) {
    return calculationName;
  }

  const fullDetails = [
    [I18N.text('Default operation'), calculationName],
    ...details,
  ];

  return fullDetails.map(([label, value], idx) => (
    <React.Fragment key={`${calculationName}--${label}--${value}`}>
      {idx > 0 && TEXT_DIVIDER}
      <div className="dc-editable-calculation-display__operation-label">
        {label}:
      </div>
      <div className="dc-editable-calculation-display__operation-value">
        {value}
      </div>
    </React.Fragment>
  ));
}

export default function CalculationDisplay({ calculation }: Props): React.Node {
  const calculationName = CALCULATION_DISPLAY_NAMES[calculation.tag];
  const calculationDetails: Array<[string, string | number]> = [];
  if (calculation.tag === 'WINDOW') {
    calculationDetails.push([
      I18N.text('Window operation type'),
      calculation.operation(),
    ]);
    calculationDetails.push([I18N.text('Window size'), calculation.size()]);
  } else if (calculation.tag === 'COUNT_DISTINCT') {
    calculationDetails.push([
      I18N.text('Dimension'),
      getFullDimensionName(calculation.dimension()),
    ]);
  } else if (calculation.tag === 'LAST_VALUE') {
    calculationDetails.push([
      I18N.text('Last value operation type'),
      calculation.operation(),
    ]);
  }

  return (
    <div className="dc-editable-calculation-display">
      {renderCalculationDetails(calculationName, calculationDetails)}
    </div>
  );
}
