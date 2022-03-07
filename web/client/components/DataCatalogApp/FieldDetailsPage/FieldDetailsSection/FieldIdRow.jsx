// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import FieldDetailsListItem from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/FieldDetailsListItem';
import I18N from 'lib/I18N';
import Tooltip from 'components/ui/Tooltip';
import useFieldCalculation from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CalculationRow/useFieldCalculation';
import { relayIdToDatabaseId } from 'util/graphql';
import type {
  FieldIdRow_field$data,
  FieldIdRow_field$key,
} from './__generated__/FieldIdRow_field.graphql';

type Props = {
  field: FieldIdRow_field$key,
};

export default function FieldIdRow({ field }: Props): React.Node {
  const data: FieldIdRow_field$data = useFragment(
    graphql`
      fragment FieldIdRow_field on field {
        id
        ...useFieldCalculation_field
      }
    `,
    field,
  );
  const { id } = data;
  const dbId = relayIdToDatabaseId(id);

  const calculation = useFieldCalculation(data);

  const isCalculatedField =
    calculation.tag === 'COHORT' || calculation.tag === 'FORMULA';

  const renderFieldID = React.useCallback(() => {
    if (isCalculatedField) {
      return (
        <Tooltip
          content={I18N.text(
            'These types of indicators use the field IDs of their constituents to reference the raw data. Please refer to the field IDs of the constituents instead.',
            'calculatedFieldHelpText',
          )}
          tooltipPlacement="right"
        >
          <I18N>N/A</I18N>
        </Tooltip>
      );
    }
    return dbId;
  }, [isCalculatedField, dbId]);

  return (
    <FieldDetailsListItem
      title={I18N.text('Field ID')}
      tooltipText={I18N.text(
        'This field ID is used to reference the raw data in your integration',
        'fieldIdHelpText',
      )}
    >
      {renderFieldID()}
    </FieldDetailsListItem>
  );
}
