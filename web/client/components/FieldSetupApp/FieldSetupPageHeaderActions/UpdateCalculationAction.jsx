// @flow
import * as React from 'react';
import { useMutation } from 'react-relay/hooks';

import Button from 'components/ui/Button';
import EditableCalculation from 'components/FieldSetupApp/UnpublishedFieldsTable/UnpublishedFieldTableRows/EditableCalculation';
import FieldFilter from 'models/core/wip/QueryFilter/FieldFilter';
import I18N from 'lib/I18N';
import Popover from 'components/ui/Popover';
import SumCalculation from 'models/core/wip/Calculation/SumCalculation';
import useBoolean from 'lib/hooks/useBoolean';
import { relayIdToDatabaseId } from 'util/graphql';
import type { Calculation } from 'models/core/wip/Calculation/types';

type Props = {
  selectedFieldIds: $ReadOnlySet<string>,
};

// Dummy placeholder field id that is used to create a default sum calculation.
// This is never actually used, replaced with real ids before commiting to db.
const DUMMY_FIELD_ID = 'default_field_id';
const DEFAULT_FILTER = FieldFilter.create({ fieldId: DUMMY_FIELD_ID });
const DEFAULT_CALCULATION = SumCalculation.create({ filter: DEFAULT_FILTER });

// Component that renders the field setup page batch update calculation button
// and action.
export default function UpdateCalculationAction({
  selectedFieldIds,
}: Props): React.Element<'div'> {
  const [commit] = useMutation(
    graphql`
      mutation UpdateCalculationActionMutation(
        $id: String!
        $calculation: jsonb!
      ) {
        update_unpublished_field_by_pk(
          pk_columns: { id: $id }
          _set: { calculation: $calculation }
        ) {
          id
          calculation
          ...UnpublishedFieldRow_unpublishedField
        }
      }
    `,
  );
  const [
    editableCalculation,
    setEditableCalculation,
  ] = React.useState<Calculation>(DEFAULT_CALCULATION);
  const [isPopoverOpen, openPopover, closePopover] = useBoolean(false);
  const popoverRef = React.useRef();

  // Reset calculation when popover closes.
  React.useEffect(() => {
    if (!isPopoverOpen) {
      setEditableCalculation(DEFAULT_CALCULATION);
    }
  }, [isPopoverOpen]);

  const onApplyButtonClick = React.useCallback(() => {
    selectedFieldIds.forEach(fieldId => {
      const dbId = relayIdToDatabaseId(fieldId);
      const filter = FieldFilter.create({ fieldId: dbId });
      const serializedUpdatedCalculation = editableCalculation.serialize();
      const serializedFilter = filter.serialize();
      // Unable to resolve the flow errors that comes with directly updating
      // the calculation filter using the zen model:
      // editableCalculation.filter(filter)
      // Flow is unable to assert that all sums have the same filter property.
      // Thus, we are serializing the calculation and updating the filter.
      const finalSerializedCalculation = {
        ...serializedUpdatedCalculation,
        filter: serializedFilter,
      };
      commit({
        variables: {
          id: dbId,
          calculation: finalSerializedCalculation,
        },
      });
      closePopover();
    });
  }, [closePopover, commit, editableCalculation, selectedFieldIds]);

  return (
    <div className="fs-update-calculation-action">
      <div ref={popoverRef}>
        <Button
          onClick={openPopover}
          outline={!isPopoverOpen}
          intent={Button.Intents.PRIMARY}
        >
          <I18N>Update Calculation</I18N>
        </Button>
      </div>
      <Popover
        anchorElt={popoverRef.current}
        anchorOrigin={Popover.Origins.BOTTOM_LEFT}
        className="fs-update-calculation-action__calculation-popover"
        containerType={Popover.Containers.NONE}
        doNotFlip
        isOpen={isPopoverOpen}
        keepInWindow
        onRequestClose={closePopover}
        popoverOrigin={Popover.Origins.TOP_LEFT}
      >
        <EditableCalculation
          calculation={editableCalculation}
          editing
          onApplyButtonClick={onApplyButtonClick}
          onCalculationChange={setEditableCalculation}
          showApplyButton
        />
      </Popover>
    </div>
  );
}
