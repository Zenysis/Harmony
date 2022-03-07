// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import CalculationCustomizationBlock from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/CalculationCustomizationBlock';
import CalculationDisplay from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CalculationRow/EditableCalculation/CalculationDisplay';
import EditableItemControls from 'components/DataCatalogApp/common/EditableItemControls';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import useDimensionList from 'components/DataCatalogApp/common/hooks/aqt/useDimensionList';
import type { Calculation } from 'models/core/wip/Calculation/types';
import type { EditableCalculation_dimensionConnection$key } from './__generated__/EditableCalculation_dimensionConnection.graphql';

type Props = {
  calculation: Calculation,
  dimensionConnection: EditableCalculation_dimensionConnection$key,
  onSaveCalculation: Calculation => void,
};

// This list contains all the calculation types that can a calculation can be
// converted between. Any calculation type in this list can be converted to all
// other calculation types in this list. It is a larger list than the set of
// calculations that can be customized in AQT since there is no concern that a
// user will improperly use a calculation type (like changing Sum to Last
// Value). Cohort and Formula calculations are not included in this list since
// they are created in a different way.
export const CALCULATION_ORDER = [
  'SUM',
  'COUNT',
  'AVG',
  'AVERAGE_OVER_TIME',
  'MIN',
  'MAX',
  'WINDOW',
  'LAST_VALUE',
  'COUNT_DISTINCT',
];

// NOTE(stephen): We don't need to provide real values to these props since they
// are *only* used for creating cohort calculations. Cohort calculation creation
// is not enabled from the FieldDetailsPage.
const UNUSED_CALCULATION_PROPS = {
  dimensionValueMap: {},
  fieldHierarchyRoot: HierarchyItem.createRoot(),
  fieldId: 'unused',
  fieldName: 'unused',
  originalFieldId: 'unused',
  trackItemSelected: () => {},
};

function EditableCalculation({
  calculation,
  dimensionConnection,
  onSaveCalculation,
}: Props): React.Element<'div'> {
  const data = useFragment(
    graphql`
      fragment EditableCalculation_dimensionConnection on dimensionConnection {
        ...useDimensionList_dimensionConnection
      }
    `,
    dimensionConnection,
  );
  const dimensions = useDimensionList(data);
  const [
    editableCalculation,
    setEditableCalculation,
  ] = React.useState<Calculation>(calculation);

  // Whenever the parent calculation changes, undo any temporary changes the
  // user might have made.
  React.useEffect(() => {
    setEditableCalculation(calculation);
  }, [calculation]);

  const [editing, setEditing] = React.useState(false);
  const onCancelEditClick = React.useCallback(() => {
    setEditableCalculation(calculation);
    setEditing(false);
  }, [calculation]);
  const onSubmitClick = React.useCallback(() => {
    onSaveCalculation(editableCalculation);
    setEditing(false);
  }, [editableCalculation, onSaveCalculation]);

  // All calculations *except* formula and cohort calculations can be edited by
  // the user.
  const editable = !(
    calculation.tag === 'FORMULA' || calculation.tag === 'COHORT'
  );

  return (
    <div className="dc-editable-calculation">
      <div className="dc-editable-calculation__name">
        {!editing && <CalculationDisplay calculation={editableCalculation} />}
        {editing && (
          // NOTE(stephen): We are using the AQT CalculationCustomizationBlock
          // directly inline. The styles are overwritten by CSS to make the
          // customization block render in a horizontal way versus the default
          // vertical orientation when it is inside a Popover. This is a
          // somewhat brittle choice, since changes to the
          // CalculationCustomizationBlock could cause this component to look
          // weird. For now, it was an ok choice to make because it saves us
          // from duplicating the logic of calculation customization inside
          // data catalog.
          <CalculationCustomizationBlock
            calculation={editableCalculation}
            className="dc-editable-calculation__customization-block"
            dimensions={dimensions}
            onCalculationChange={setEditableCalculation}
            selectableCalculationTypes={CALCULATION_ORDER}
            {...UNUSED_CALCULATION_PROPS}
          />
        )}
      </div>
      {editable && (
        <EditableItemControls
          className="dc-editable-calculation__edit-button-wrapper"
          editing={editing}
          onCancelClick={onCancelEditClick}
          onEditClick={() => setEditing(true)}
          onSubmitClick={onSubmitClick}
        />
      )}
    </div>
  );
}

export default (React.memo<Props>(
  EditableCalculation,
): React.AbstractComponent<Props>);
