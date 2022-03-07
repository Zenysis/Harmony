// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import IndicatorSectionRow from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorSectionRow';
import LastValueCalculation from 'models/core/wip/Calculation/LastValueCalculation';
import type { AggregationOperation } from 'models/core/wip/Calculation/LastValueCalculation';

type Props = {
  calculation: LastValueCalculation,
  onCalculationChange: LastValueCalculation => void,
};

const TEXT = t(
  'common.QueryBuilder.CustomizableIndicatorTag.IndicatorCustomizationModule.CalculationCustomizationBlock.LastValueCalculationCustomizationBlock',
);

const OPERATION_ORDER: $ReadOnlyArray<{
  label: string,
  operation: AggregationOperation,
}> = [
  { label: TEXT.operation.sum, operation: 'sum' },
  { label: TEXT.operation.count, operation: 'count' },
  { label: TEXT.operation.min, operation: 'min' },
  { label: TEXT.operation.max, operation: 'max' },
  { label: TEXT.operation.average, operation: 'average' },
];

function LastValueCalculationCustomizationBlock({
  calculation,
  onCalculationChange,
}: Props): React.Node {
  const onOperationChange = React.useCallback(
    (operation: AggregationOperation) =>
      onCalculationChange(calculation.operation(operation)),
    [calculation, onCalculationChange],
  );

  return (
    <React.Fragment>
      <IndicatorSectionRow title={TEXT.title.operation}>
        <Dropdown
          buttonWidth="100%"
          menuWidth="100%"
          onSelectionChange={onOperationChange}
          value={calculation.operation()}
        >
          {OPERATION_ORDER.map(({ label, operation }) => (
            <Dropdown.Option key={operation} value={operation}>
              {label}
            </Dropdown.Option>
          ))}
        </Dropdown>
      </IndicatorSectionRow>
    </React.Fragment>
  );
}

export default (React.memo(
  LastValueCalculationCustomizationBlock,
): React.AbstractComponent<Props>);
