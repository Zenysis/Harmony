// @flow
import * as React from 'react';
import { useFragment, useMutation } from 'react-relay/hooks';

import EditableCalculation from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CalculationRow/EditableCalculation';
import FieldDetailsListItem from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/FieldDetailsListItem';
import I18N from 'lib/I18N';
import useFieldCalculation from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CalculationRow/useFieldCalculation';
import { relayIdToDatabaseId } from 'util/graphql';
import type { CalculationRowMutation } from './__generated__/CalculationRowMutation.graphql';
import type { CalculationRow_dimensionConnection$key } from './__generated__/CalculationRow_dimensionConnection.graphql';
import type { CalculationRow_field$key } from './__generated__/CalculationRow_field.graphql';

type Props = {
  dimensionConnection: CalculationRow_dimensionConnection$key,
  field: CalculationRow_field$key,
};

export default function CalculationRow({
  field,
  dimensionConnection,
}: Props): React.Node {
  const data = useFragment(
    graphql`
      fragment CalculationRow_field on field {
        id
        ...useFieldCalculation_field
      }
    `,
    field,
  );

  const dimensions = useFragment(
    graphql`
      fragment CalculationRow_dimensionConnection on dimensionConnection {
        ...EditableCalculation_dimensionConnection
      }
    `,
    dimensionConnection,
  );

  const { id } = data;
  const calculation = useFieldCalculation(data);

  const [commit] = useMutation<CalculationRowMutation>(
    graphql`
      mutation CalculationRowMutation($dbId: String!, $newCalculation: jsonb!) {
        update_field_by_pk(
          pk_columns: { id: $dbId }
          _set: { calculation: $newCalculation }
        ) {
          id
          calculation
        }
      }
    `,
  );

  const onSaveCalculation = React.useCallback(
    newCalculation => {
      const serializedCalculation = newCalculation.serialize();
      commit({
        variables: {
          dbId: relayIdToDatabaseId(id),
          newCalculation: serializedCalculation,
        },
      });
    },
    [commit, id],
  );

  return (
    <FieldDetailsListItem title={I18N.text('Operation', 'operation')}>
      <EditableCalculation
        calculation={calculation}
        dimensionConnection={dimensions}
        onSaveCalculation={onSaveCalculation}
      />
    </FieldDetailsListItem>
  );
}
