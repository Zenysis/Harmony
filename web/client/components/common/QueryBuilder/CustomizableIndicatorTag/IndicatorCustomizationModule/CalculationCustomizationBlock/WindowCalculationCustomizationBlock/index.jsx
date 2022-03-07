// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import IndicatorSectionRow from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorSectionRow';
import WindowCalculation from 'models/core/wip/Calculation/WindowCalculation';
import { range } from 'util/arrayUtil';
import type { WindowOperation } from 'models/core/wip/Calculation/WindowCalculation';

type Props = {
  calculation: WindowCalculation,
  onCalculationChange: WindowCalculation => void,
};

const TEXT = t(
  'common.QueryBuilder.CustomizableIndicatorTag.IndicatorCustomizationModule.CalculationCustomizationBlock.WindowCalculationCustomizationBlock',
);

const OPERATION_ORDER: $ReadOnlyArray<{
  label: string,
  operation: WindowOperation,
}> = [
  { label: TEXT.operation.sum, operation: 'sum' },
  { label: TEXT.operation.average, operation: 'average' },
  { label: TEXT.operation.min, operation: 'min' },
  { label: TEXT.operation.max, operation: 'max' },
];

const MAX_WINDOW_SIZE = 60;

function WindowCalculationCustomizationBlock({
  calculation,
  onCalculationChange,
}: Props): React.Node {
  const onOperationChange = React.useCallback(
    (operation: WindowOperation) =>
      onCalculationChange(calculation.operation(operation)),
    [calculation, onCalculationChange],
  );

  const onWindowSizeChange = React.useCallback(
    (size: number) => onCalculationChange(calculation.size(size)),
    [calculation, onCalculationChange],
  );

  // TODO(stephen): Is it weird that the range is a dropdown? It feels weird to
  // me but there isn't a clean numeric InputText component to use.
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
      <IndicatorSectionRow title={TEXT.title.size}>
        <Dropdown
          buttonWidth="100%"
          enableSearch
          menuWidth="100%"
          onSelectionChange={onWindowSizeChange}
          value={calculation.size()}
        >
          {range(1, MAX_WINDOW_SIZE + 1).map(size => (
            <Dropdown.Option key={size} searchableText={`${size}`} value={size}>
              {size}
            </Dropdown.Option>
          ))}
        </Dropdown>
      </IndicatorSectionRow>
    </React.Fragment>
  );
}

export default (React.memo(
  WindowCalculationCustomizationBlock,
): React.AbstractComponent<Props>);
