// @flow
import * as React from 'react';

import CountDistinctCalculation from 'models/core/wip/Calculation/CountDistinctCalculation';
import CountDistinctCustomizationBlock from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/CalculationCustomizationBlock/CountDistinctCustomizationBlock';
import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import IndicatorSectionRow from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorSectionRow';
import IndicatorSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/IndicatorSelectionBlock/IndicatorSelector';
import LastValueCalculation from 'models/core/wip/Calculation/LastValueCalculation';
import LastValueCalculationCustomizationBlock from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/CalculationCustomizationBlock/LastValueCalculationCustomizationBlock';
import WindowCalculation from 'models/core/wip/Calculation/WindowCalculation';
import WindowCalculationCustomizationBlock from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/CalculationCustomizationBlock/WindowCalculationCustomizationBlock';
import convertCalculationToNewType from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/CalculationCustomizationBlock/convertCalculationToNewType';
import {
  CALCULATION_DISPLAY_NAMES,
  CALCULATION_ORDER,
} from 'models/core/wip/Calculation/registry';
import type Dimension from 'models/core/wip/Dimension';
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import type Field from 'models/core/wip/Field';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type {
  Calculation,
  CalculationType,
} from 'models/core/wip/Calculation/types';

type Props = {
  calculation: Calculation,
  className?: string,
  dimensions: $ReadOnlyArray<Dimension>,
  dimensionValueMap: {
    +[dimensionId: string]: $ReadOnlyArray<DimensionValue>,
  } | void,
  fieldHierarchyRoot: $PropertyType<
    React.ElementConfig<typeof IndicatorSelector>,
    'hierarchyRoot',
  >,
  fieldId: string,
  fieldName: string,
  onCalculationChange: Calculation => void,
  originalFieldId: string,

  selectableCalculationTypes?: $ReadOnlyArray<CalculationType>,
  trackItemSelected: (HierarchyItem<Field>) => void,
};

function CalculationCustomizationBlock({
  calculation,
  dimensions,
  dimensionValueMap,
  fieldHierarchyRoot,
  fieldId,
  fieldName,
  onCalculationChange,
  originalFieldId,
  trackItemSelected,

  className = '',
  selectableCalculationTypes = CALCULATION_ORDER,
}: Props): React.Node {
  // Find the default dimension that should be used for calculations that
  // require a dimension to be set. If the original field uses COUNT DISTINCT
  // calculation type, then we should use the originally selected
  // dimension as the default. Otherwise, choose the first dimension in the list.
  // Also finds the default filter to use.

  const [defaultDimension, defaultFilter] = React.useMemo(() => {
    // If we cannot find the original field in the hierarchy tree, default to
    // the first dimension.
    const hierarchyItem = fieldHierarchyRoot.findItemById(originalFieldId);
    if (hierarchyItem === undefined) {
      return [dimensions[0], null];
    }

    // If we somehow have found a LinkedCategory (should not be possible), we
    // will fallback to the first dimension.
    const value = hierarchyItem.metadata();
    if (value.tag !== 'FIELD') {
      return [dimensions[0], null];
    }

    // If the field's original calculation was CountDistinct, then we
    // want to use the dimension stored on that calculation.
    const originalCalculation = value.calculation();
    const filter = originalCalculation.get('filter');
    if (originalCalculation.tag === 'COUNT_DISTINCT') {
      const dimensionId = originalCalculation.get('dimension');
      const dimension = dimensions.find(dim => dim.id() === dimensionId);
      if (dimension !== undefined) {
        return [dimension, filter];
      }
    }
    return [dimensions[0], filter];
  }, [dimensions, fieldHierarchyRoot, originalFieldId]);

  const onCalculationTypeChange = React.useCallback(
    calculationType => {
      onCalculationChange(
        convertCalculationToNewType(
          calculation,
          calculationType,
          defaultDimension,
          fieldName,
          defaultFilter,
        ),
      );
    },
    [
      calculation,
      defaultDimension,
      fieldName,
      onCalculationChange,
      defaultFilter,
    ],
  );

  const onSelectionChange = (newCalculationType: CalculationType) => {
    onCalculationTypeChange(newCalculationType);
  };

  const disableCustomization = selectableCalculationTypes.length < 2;

  // Certain calculation types have detailed settings that can be specified by
  // the user.
  function maybeRenderSpecialCustomizationComponent() {
    if (calculation instanceof CountDistinctCalculation) {
      return (
        <CountDistinctCustomizationBlock
          calculation={calculation}
          dimensions={dimensions}
          onCalculationChange={onCalculationChange}
        />
      );
    }

    if (calculation instanceof LastValueCalculation) {
      return (
        <LastValueCalculationCustomizationBlock
          calculation={calculation}
          onCalculationChange={onCalculationChange}
        />
      );
    }

    if (calculation instanceof WindowCalculation) {
      return (
        <WindowCalculationCustomizationBlock
          calculation={calculation}
          onCalculationChange={onCalculationChange}
        />
      );
    }

    return null;
  }

  return (
    <div className={className}>
      <IndicatorSectionRow title={I18N.text('Operation')}>
        <Dropdown
          buttonWidth="100%"
          defaultDisplayContent
          disableSelect={disableCustomization}
          menuWidth="100%"
          onSelectionChange={onSelectionChange}
          value={calculation.tag}
        >
          {selectableCalculationTypes.map(type => (
            <Dropdown.Option key={type} value={type}>
              {CALCULATION_DISPLAY_NAMES[type]}
            </Dropdown.Option>
          ))}
        </Dropdown>
      </IndicatorSectionRow>
      {maybeRenderSpecialCustomizationComponent()}
    </div>
  );
}

export default (React.memo(
  CalculationCustomizationBlock,
): React.AbstractComponent<Props>);
