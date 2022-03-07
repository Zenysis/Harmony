// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import CalculationCustomizationBlock from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/CalculationCustomizationBlock';
import Group from 'components/ui/Group';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import I18N from 'lib/I18N';
import useDimensionList from 'components/DataCatalogApp/common/hooks/aqt/useDimensionList';
import useFieldCalculation from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CalculationRow/useFieldCalculation';
import { CALCULATION_ORDER } from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CalculationRow/EditableCalculation';
import type { Calculation } from 'models/core/wip/Calculation/types';
import type { CopyIndicatorView_dimensionConnection$key } from './__generated__/CopyIndicatorView_dimensionConnection.graphql';
import type { CopyIndicatorView_field$key } from './__generated__/CopyIndicatorView_field.graphql';

type Props = {
  dimensionConnection: CopyIndicatorView_dimensionConnection$key,
  editableCalculation: Calculation | void,
  fieldConnection: CopyIndicatorView_field$key,
  onCalculationChange: Calculation => void,
};

// NOTE(yitian): CalculationCustomizationBlock expects these inputs. We don't
// need to provide real values to these props since they are *only* used for
// creating cohort calculations. Cohort creation is not enabled here.
const UNUSED_CALCULATION_PROPS = {
  dimensionValueMap: {},
  fieldHierarchyRoot: HierarchyItem.createRoot(),
  fieldId: 'unused',
  fieldName: 'unused',
  originalFieldId: 'unused',
  trackItemSelected: () => {},
};

export default function CopyIndicatorView({
  dimensionConnection,
  editableCalculation,
  fieldConnection,
  onCalculationChange,
}: Props): React.Element<typeof Group.Vertical | typeof I18N> | null {
  const field = useFragment(
    graphql`
      fragment CopyIndicatorView_field on field {
        name
        ...useFieldCalculation_field
      }
    `,
    fieldConnection,
  );

  const dimensionData = useFragment(
    graphql`
      fragment CopyIndicatorView_dimensionConnection on dimensionConnection {
        ...useDimensionList_dimensionConnection
      }
    `,
    dimensionConnection,
  );

  const calculation = useFieldCalculation(field);
  const dimensions = useDimensionList(dimensionData);

  // NOTE(yitian): This runs once on initialization when `editableCalculation`,
  // which is the calculation state variable from the parent component
  // CreateCalculationIndicatorView, is undefined.
  React.useEffect(() => {
    if (calculation !== undefined && editableCalculation === undefined) {
      onCalculationChange(calculation);
    }
  }, [calculation, editableCalculation, onCalculationChange]);

  const fieldNameObject = (
    <div className="dc-copy-indicator-view__field-name">{field.name}</div>
  );

  if (
    calculation !== undefined &&
    (calculation.tag === 'FORMULA' || calculation.tag === 'COHORT')
  ) {
    return (
      <Group.Vertical spacing="m">
        {fieldNameObject}
        <I18N>
          Unable to change operation type for formula and cohort calculation
          type indicators
        </I18N>
      </Group.Vertical>
    );
  }

  if (calculation !== undefined && editableCalculation !== undefined) {
    return (
      <Group.Vertical spacing="m">
        {fieldNameObject}
        <CalculationCustomizationBlock
          calculation={editableCalculation}
          className="dc-copy-indicator-view__customization-block"
          dimensions={dimensions}
          onCalculationChange={onCalculationChange}
          selectableCalculationTypes={CALCULATION_ORDER}
          {...UNUSED_CALCULATION_PROPS}
        />
      </Group.Vertical>
    );
  }
  return null;
}
