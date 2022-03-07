// @flow
import * as React from 'react';

import FieldMetadataService from 'services/wip/FieldMetadataService';
import FieldService from 'services/wip/FieldService';
import IndicatorCustomizationModuleLayout from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorCustomizationModuleLayout';
import IndicatorGeneralSettingsPanel from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorGeneralSettingsPanel';
import LegacyIndicatorAboutPanel from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorAboutPanel/LegacyIndicatorAboutPanel';
import { cancelPromise } from 'util/promiseUtil';
import type Dimension from 'models/core/wip/Dimension';
import type Field from 'models/core/wip/Field';
import type FieldMetadata from 'models/core/wip/FieldMetadata';
import typeof DimensionFilterBlock from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/DimensionFilterBlock';
import typeof IndicatorSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/IndicatorSelectionBlock/IndicatorSelector';

type Props = {
  dimensionValueMap: $PropertyType<
    React.ElementConfig<DimensionFilterBlock>,
    'dimensionValueMap',
  >,
  dimensions: $ReadOnlyArray<Dimension>,
  field: Field,
  fieldHierarchyRoot: $PropertyType<
    React.ElementConfig<IndicatorSelector>,
    'hierarchyRoot',
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

function IndicatorCustomizationModule({
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
  const fieldId = field.id();
  const calculation = field.calculation();

  const [
    fieldMetadata,
    setFieldMetadata,
  ] = React.useState<FieldMetadata | void>(undefined);
  const [constituents, setConstituents] = React.useState<$ReadOnlyArray<Field>>(
    [],
  );

  const originalFieldId = field.originalId();
  React.useEffect(() => {
    const promise = FieldMetadataService.get(originalFieldId)
      .then(metadata => {
        if (metadata !== undefined) {
          setFieldMetadata(metadata);
          return metadata.constituentIds();
        }

        return [];
      })
      .then((constituentIds: $ReadOnlyArray<string>) =>
        Promise.all(constituentIds.map(FieldService.get)),
      )
      .then((constituentFields: $ReadOnlyArray<Field | void>) =>
        // NOTE(stephen): Flow is having a really hard time resolving the
        // chained promise and types passed around. It thinks that the call
        // to Array.filter is not actually filtering out the undefined values.
        // $FlowIssue[incompatible-call]
        setConstituents(constituentFields.filter(c => c !== undefined)),
      );

    return () => cancelPromise(promise);
  }, [originalFieldId]);

  const onAddConstituentsClick = React.useMemo(() => {
    if (constituents.length === 0) {
      return undefined;
    }

    return () => onAddConstituents(fieldId, constituents);
  }, [constituents, fieldId, onAddConstituents]);

  const onCopyIndicatorClick = React.useCallback(() => {
    onDuplicateField(fieldId);
    onCloseCustomizationModule();
  }, [fieldId, onCloseCustomizationModule, onDuplicateField]);

  function renderGeneralSettingsPanel() {
    return (
      <IndicatorGeneralSettingsPanel
        dimensionValueMap={dimensionValueMap}
        dimensions={dimensions}
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
    // NOTE(stephen): Cohort calculations should not display the about tab
    // since the customized calculation might not have any relation to the
    // original Field's hierarchy. This is a temporary limitation since the only
    // way to create a cohort calculation is by customizing an existing field.
    if (calculation.tag === 'COHORT') {
      return null;
    }

    // If no field metadata has been found for this field yet, return null so
    // that the tab is disabled.
    if (fieldMetadata === undefined) {
      return null;
    }

    return (
      <LegacyIndicatorAboutPanel
        fieldId={originalFieldId}
        fieldMetadata={fieldMetadata}
      />
    );
  }

  return (
    <IndicatorCustomizationModuleLayout
      aboutPanel={maybeRenderAboutPanel()}
      generalSettingsPanel={renderGeneralSettingsPanel()}
      onCopyClick={onCopyIndicatorClick}
    />
  );
}

export default (React.memo(
  IndicatorCustomizationModule,
): React.AbstractComponent<Props>);
