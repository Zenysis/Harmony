// @flow
import * as React from 'react';

import CopyIndicatorViewWrapper from 'components/DataCatalogApp/common/CreateCalculationIndicatorView/CopyIndicatorViewWrapper';
import FormulaText from 'components/DataCatalogApp/common/FormulaText';
import type { Calculation } from 'models/core/wip/Calculation/types';
import type { IndicatorCreationType } from 'components/DataCatalogApp/common/CreateCalculationIndicatorView';

type Props = {
  calculation: Calculation | void,
  indicatorCreationType: IndicatorCreationType,
  onCalculationChange: Calculation => void,
  selectedFieldIdToCopy: string | void,
};

export default function DisplayCalculationView({
  calculation,
  indicatorCreationType,
  onCalculationChange,
  selectedFieldIdToCopy,
}: Props): React.Element<
  'div' | typeof CopyIndicatorViewWrapper,
> | null {
  if (
    indicatorCreationType === 'CALCULATION' &&
    calculation !== undefined &&
    calculation.tag === 'FORMULA'
  ) {
    return (
      <div className="create-calculation-indicator-view__formula-block">
        <FormulaText
          calculation={calculation}
          className="create-calculation-indicator-view__formula-text"
        />
      </div>
    );
  }
  if (indicatorCreationType === 'COPY' && selectedFieldIdToCopy !== undefined) {
    return (
      <CopyIndicatorViewWrapper
        editableCalculation={calculation}
        fieldId={selectedFieldIdToCopy}
        onCalculationChange={onCalculationChange}
      />
    );
  }
  return null;
}
