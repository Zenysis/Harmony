// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import IndicatorSectionRow from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorSectionRow';
import LastValueCalculation from 'models/core/wip/Calculation/LastValueCalculation';
import type { AggregationOperation } from 'models/core/wip/Calculation/LastValueCalculation';

type Props = {
  calculation: LastValueCalculation,
  onCalculationChange: LastValueCalculation => void,
};

const OPERATION_ORDER: $ReadOnlyArray<{
  label: string,
  operation: AggregationOperation,
}> = [
  { label: I18N.text('Sum'), operation: 'sum' },
  { label: I18N.text('Count'), operation: 'count' },
  { label: I18N.textById('Min'), operation: 'min' },
  { label: I18N.textById('Max'), operation: 'max' },
  { label: I18N.text('Average'), operation: 'average' },
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
      <IndicatorSectionRow title={I18N.text('Last value aggregation')}>
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
