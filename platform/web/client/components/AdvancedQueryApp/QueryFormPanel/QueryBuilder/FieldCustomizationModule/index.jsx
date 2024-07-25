// @flow
import * as React from 'react';

import FieldAboutPanel from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FieldCustomizationModule/FieldAboutPanel';
import IndicatorCustomizationModuleLayout from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorCustomizationModuleLayout';
import IndicatorGeneralSettingsPanel from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorGeneralSettingsPanel';
import useFormulaCalculationForDisplay from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FieldCustomizationModule/useFormulaCalculationForDisplay';
import useOriginalCalculation from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FieldCustomizationModule/useOriginalCalculation';
import type Dimension from 'models/core/wip/Dimension';
import type Field from 'models/core/wip/Field';
import typeof CalculationCustomizationBlock from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/CalculationCustomizationBlock';
import typeof DimensionFilterBlock from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/DimensionFilterBlock';

type Props = {
  dimensions: $ReadOnlyArray<Dimension>,
  dimensionValueMap: $PropertyType<
    React.ElementConfig<DimensionFilterBlock>,
    'dimensionValueMap',
  >,
  field: Field,
  fieldHierarchyRoot: $PropertyType<
    React.ElementConfig<CalculationCustomizationBlock>,
    'fieldHierarchyRoot',
  >,
  filterHierarchyRoot: $PropertyType<
    React.ElementConfig<DimensionFilterBlock>,
    'hierarchyRoot',
  >,
  onAddConstituents: (
    fieldId: string,
    constituents: $ReadOnlyArray<Field>,
  ) => void,
  onCloseCustomizationModule: () => void,
  onDuplicateField: (fieldId: string) => void,
  onFieldCustomized: (item: Field) => void,
  trackItemSelected: $PropertyType<
    React.ElementConfig<typeof IndicatorGeneralSettingsPanel>,
    'trackItemSelected',
  >,
};

function FieldCustomizationModule({
  dimensionValueMap,
  dimensions,
  field,
  fieldHierarchyRoot,
  filterHierarchyRoot,
  onAddConstituents,
  onCloseCustomizationModule,
  onDuplicateField,
  onFieldCustomized,
  trackItemSelected,
}: Props) {
  const dbFieldId = field.originalId();
  const fieldId = field.id();

  const [originalCalculation, constituentFields] = useOriginalCalculation(
    dbFieldId,
    fieldHierarchyRoot,
  );

  // NOTE: See comment in `FieldAboutPanelContent` for why we need
  // to produce a special FormulaCalculation only for display purposes.
  const formulaCalculationForDisplay = useFormulaCalculationForDisplay(
    originalCalculation,
    constituentFields,
  );

  const onAddConstituentsClick = React.useMemo(() => {
    if (constituentFields.length === 0) {
      return undefined;
    }

    return () => onAddConstituents(fieldId, constituentFields);
  }, [constituentFields, fieldId, onAddConstituents]);

  const onCopyClick = React.useCallback(() => {
    onDuplicateField(fieldId);
    onCloseCustomizationModule();
  }, [fieldId, onCloseCustomizationModule, onDuplicateField]);

  function renderGeneralSettingsPanel() {
    return (
      <IndicatorGeneralSettingsPanel
        dimensions={dimensions}
        dimensionValueMap={dimensionValueMap}
        field={field}
        fieldHierarchyRoot={fieldHierarchyRoot}
        filterHierarchyRoot={filterHierarchyRoot}
        onAddConstituentsClick={onAddConstituentsClick}
        onFieldCustomized={onFieldCustomized}
        trackItemSelected={trackItemSelected}
      />
    );
  }

  function maybeRenderAboutPanel() {
    return (
      <FieldAboutPanel
        dbFieldId={dbFieldId}
        formulaCalculationForDisplay={formulaCalculationForDisplay}
      />
    );
  }

  return (
    <IndicatorCustomizationModuleLayout
      aboutPanel={maybeRenderAboutPanel()}
      generalSettingsPanel={renderGeneralSettingsPanel()}
      onCopyClick={onCopyClick}
    />
  );
}

export default (React.memo(
  FieldCustomizationModule,
): React.AbstractComponent<Props>);
