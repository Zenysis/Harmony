// @flow
import * as React from 'react';
import { useFragment, useMutation } from 'react-relay/hooks';

import EditableCalculation from 'components/FieldSetupApp/UnpublishedFieldsTable/UnpublishedFieldTableRows/EditableCalculation';
import useUnpublishedFieldCalculation from 'components/FieldSetupApp/UnpublishedFieldsTable/UnpublishedFieldTableRows/useUnpublishedFieldCalculation';
import { relayIdToDatabaseId } from 'util/graphql';
import type { CalculationInput_unpublishedField$key } from './__generated__/CalculationInput_unpublishedField.graphql';

type Props = {
  unpublishedFieldRef: CalculationInput_unpublishedField$key,
};

/** Uncontrolled component that manages calculation inputs and commits changes. */
export default function CalculationInput({
  unpublishedFieldRef,
}: Props): React.Element<'div'> | null {
  const data = useFragment(
    graphql`
      fragment CalculationInput_unpublishedField on unpublished_field {
        id
        ...useUnpublishedFieldCalculation_unpublishedField
      }
    `,
    unpublishedFieldRef,
  );

  const calculation = useUnpublishedFieldCalculation(data);

  const [commit] = useMutation(
    graphql`
      mutation CalculationInputMutation(
        $calculation: jsonb!
        $fieldId: String!
      ) {
        update_unpublished_field_by_pk(
          pk_columns: { id: $fieldId }
          _set: { calculation: $calculation }
        ) {
          id
          calculation
        }
      }
    `,
  );

  const fieldId = data.id;

  const onCalculationChange = React.useCallback(
    newCalculation => {
      const newCalculationObj = newCalculation.serialize();
      if (
        calculation &&
        JSON.stringify(calculation.serialize()) !==
          JSON.stringify(newCalculationObj)
      ) {
        commit({
          variables: {
            fieldId: relayIdToDatabaseId(fieldId),
            calculation: newCalculationObj,
          },
        });
      }
    },
    [calculation, commit, fieldId],
  );

  return calculation !== undefined ? (
    <div className="fs-calculation-input">
      <EditableCalculation
        calculation={calculation}
        editing
        onCalculationChange={onCalculationChange}
      />
    </div>
  ) : null;
}
