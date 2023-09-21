// @flow
import * as React from 'react';

import CountDistinctCalculation from 'models/core/wip/Calculation/CountDistinctCalculation';
import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import IndicatorSectionRow from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorSectionRow';
import type Dimension from 'models/core/wip/Dimension';

type Props = {
  calculation: CountDistinctCalculation,
  dimensions: $ReadOnlyArray<Dimension>,
  onCalculationChange: CountDistinctCalculation => void,
};

function CountDistinctCustomizationBlock({
  calculation,
  dimensions,
  onCalculationChange,
}: Props) {
  const onDimensionIdChange = React.useCallback(
    (dimensionId: string) =>
      onCalculationChange(calculation.dimension(dimensionId)),
    [calculation, onCalculationChange],
  );

  return (
    <IndicatorSectionRow title={I18N.text('Count distinct dimension')}>
      <Dropdown
        buttonWidth="100%"
        enableSearch
        menuWidth="100%"
        onSelectionChange={onDimensionIdChange}
        value={calculation.dimension()}
      >
        {dimensions.map((dimension: Dimension) => (
          <Dropdown.Option
            key={dimension.id()}
            searchableText={dimension.name()}
            value={dimension.id()}
          >
            {dimension.name()}
          </Dropdown.Option>
        ))}
      </Dropdown>
    </IndicatorSectionRow>
  );
}

export default (React.memo(
  CountDistinctCustomizationBlock,
): React.AbstractComponent<Props>);
