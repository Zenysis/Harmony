// @flow
import * as React from 'react';

import CalculationCustomizationBlock from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/CalculationCustomizationBlock';
import Checkbox from 'components/ui/Checkbox';
import DimensionFilterBlock from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/DimensionFilterBlock';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import IndicatorCustomizationModuleBlock from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorCustomizationModuleBlock';
import IndicatorSectionRow from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorSectionRow';
import IndicatorSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/IndicatorSelectionBlock/IndicatorSelector';
import InputText from 'components/ui/InputText';
import LegacyButton from 'components/ui/LegacyButton';
import Spacing from 'components/ui/Spacing';
import canCustomizeCalculation from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/CalculationCustomizationBlock/canCustomizeCalculation';
import type Dimension from 'models/core/wip/Dimension';
import type Field from 'models/core/wip/Field';
import type { Calculation } from 'models/core/wip/Calculation/types';

type Props = {
  dimensions: $ReadOnlyArray<Dimension>,
  dimensionValueMap: $PropertyType<
    React.ElementConfig<typeof DimensionFilterBlock>,
    'dimensionValueMap',
  >,
  field: Field,
  fieldHierarchyRoot: $PropertyType<
    React.ElementConfig<typeof IndicatorSelector>,
    'hierarchyRoot',
  >,
  filterHierarchyRoot: $PropertyType<
    React.ElementConfig<typeof DimensionFilterBlock>,
    'hierarchyRoot',
  >,
  onAddConstituentsClick: (() => void) | void,
  onFieldCustomized: (item: Field) => void,
  trackItemSelected: $PropertyType<
    React.ElementConfig<typeof CalculationCustomizationBlock>,
    'trackItemSelected',
  >,
};

function IndicatorGeneralSettingsPanel({
  dimensionValueMap,
  dimensions,
  field,
  fieldHierarchyRoot,
  filterHierarchyRoot,
  onAddConstituentsClick,
  onFieldCustomized,
  trackItemSelected,
}: Props) {
  const fieldId = field.id();
  const calculation = field.calculation();
  const originalFieldId = field.originalId();

  const onFieldLabelChange = React.useCallback(
    (label: string) => {
      onFieldCustomized(field.userDefinedLabel(label));
    },
    [fieldId, field, onFieldCustomized],
  );

  const onCalculationChange = React.useCallback(
    (newCalculation: Calculation) =>
      onFieldCustomized(field.calculation(newCalculation)),
    [field, onFieldCustomized],
  );

  const onNoDataValueToZeroClick = React.useCallback(
    (isSelected: boolean) =>
      onFieldCustomized(field.showNullAsZero(isSelected)),
    [field, onFieldCustomized],
  );

  // If the calculation is not customizable, change the possible calculation
  // types that can be selected to *only* be the current calculation type. If
  // the calculation *is* customizable, pass `undefined` so that the default
  // list of calculation types is used.
  const selectableCalculationTypes = React.useMemo(
    () =>
      !canCustomizeCalculation(calculation) ? [calculation.tag] : undefined,
    [calculation],
  );

  return (
    <div className="indicator-general-settings-panel">
      <IndicatorCustomizationModuleBlock title={I18N.textById('General')}>
        <Group.Vertical marginTop="l" spacing="l">
          <IndicatorSectionRow title={I18N.text('Label')}>
            <InputText.Uncontrolled
              debounce
              debounceTimeoutMs={200}
              initialValue={field.label()}
              onChange={onFieldLabelChange}
            />
          </IndicatorSectionRow>
          <CalculationCustomizationBlock
            calculation={calculation}
            dimensions={dimensions}
            dimensionValueMap={dimensionValueMap}
            fieldHierarchyRoot={fieldHierarchyRoot}
            fieldId={fieldId}
            fieldName={field.canonicalName()}
            onCalculationChange={onCalculationChange}
            originalFieldId={originalFieldId}
            selectableCalculationTypes={selectableCalculationTypes}
            trackItemSelected={trackItemSelected}
          />
          <Checkbox
            className="indicator-general-settings-panel__no-data-checkbox"
            label={I18N.text("Display 'No Data' results as zero")}
            labelPlacement="right"
            onChange={onNoDataValueToZeroClick}
            value={field.showNullAsZero()}
          />
          {onAddConstituentsClick !== undefined && (
            <div className="indicator-general-settings-panel__constituents-block">
              <LegacyButton
                className="indicator-general-settings-panel__add-constituents-btn"
                onClick={onAddConstituentsClick}
                type={LegacyButton.Intents.DEFAULT}
              >
                {I18N.text('Add Constituents')}
                <Icon type="plus" />
              </LegacyButton>
            </div>
          )}
        </Group.Vertical>
      </IndicatorCustomizationModuleBlock>
      <Spacing marginTop="xl">
        <IndicatorCustomizationModuleBlock
          title={I18N.textById('Filters')}
          titleTooltip={I18N.textById(
            'Limit data for the indicator you have selected',
          )}
        >
          <Spacing marginTop="m">
            <DimensionFilterBlock
              dimensionValueMap={dimensionValueMap}
              hierarchyRoot={filterHierarchyRoot}
              itemToCustomize={field}
              onDimensionFiltersChange={onFieldCustomized}
            />
          </Spacing>
        </IndicatorCustomizationModuleBlock>
      </Spacing>
    </div>
  );
}

export default (React.memo(
  IndicatorGeneralSettingsPanel,
): React.AbstractComponent<Props>);
