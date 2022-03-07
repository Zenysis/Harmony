// @flow
import * as React from 'react';
import { useLazyLoadQuery } from 'react-relay/hooks';

import CalculationCustomizationBlock from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/CalculationCustomizationBlock';
import CalculationDisplay from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CalculationRow/EditableCalculation/CalculationDisplay';
import FullButton from 'components/ui/DatePicker/internal/FullButton';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import I18N from 'lib/I18N';
import useDimensionList from 'components/DataCatalogApp/common/hooks/aqt/useDimensionList';
import { noop } from 'util/util';
import type { Calculation } from 'models/core/wip/Calculation/types';
import type { EditableCalculationQuery } from './__generated__/EditableCalculationQuery.graphql';

type Props = {
  calculation: Calculation,
  editing: boolean,
  onCalculationChange: Calculation => void,

  onApplyButtonClick?: () => void,
  showApplyButton?: boolean,
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

// NOTE(yitian): We don't need to provide real values to these props since they
// are *only* used for creating cohort calculations. Cohort calculation creation
// is not enabled from the the Field Setup App.
const UNUSED_CALCULATION_PROPS = {
  dimensionValueMap: {},
  fieldHierarchyRoot: HierarchyItem.createRoot(),
  fieldId: 'unused',
  fieldName: 'unused',
  originalFieldId: 'unused',
  trackItemSelected: () => {},
};

const POLICY = { fetchPolicy: 'store-or-network' };

export default function EditableCalculation({
  calculation,
  editing,
  onCalculationChange,
  onApplyButtonClick = noop,
  showApplyButton = false,
}: Props): React.Element<'div'> {
  const data = useLazyLoadQuery<EditableCalculationQuery>(
    graphql`
      query EditableCalculationQuery {
        dimensionConnection: dimension_connection {
          ...useDimensionList_dimensionConnection
        }
      }
    `,
    {},
    POLICY,
  );

  const dimensions = useDimensionList(data.dimensionConnection);

  const applyButtonText = I18N.textById('apply');

  const applyButton = (
    <FullButton ariaName={applyButtonText} onClick={onApplyButtonClick}>
      <Heading.Small whiteText>{applyButtonText}</Heading.Small>
    </FullButton>
  );

  return (
    <div className="fs-editable-calculation">
      {!editing && <CalculationDisplay calculation={calculation} />}
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
        <Group.Vertical spacing="m">
          <CalculationCustomizationBlock
            calculation={calculation}
            className="fs-editable-calculation__customization-block"
            dimensions={dimensions}
            onCalculationChange={onCalculationChange}
            selectableCalculationTypes={CALCULATION_ORDER}
            {...UNUSED_CALCULATION_PROPS}
          />
          {showApplyButton && applyButton}
        </Group.Vertical>
      )}
    </div>
  );
}
