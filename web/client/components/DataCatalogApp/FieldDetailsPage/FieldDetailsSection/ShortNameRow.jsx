// @flow
import * as React from 'react';
import { useFragment, useMutation } from 'react-relay/hooks';

import EditableTextValue from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/EditableTextValue';
import FieldDetailsListItem from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/FieldDetailsListItem';
import I18N from 'lib/I18N';
import { relayIdToDatabaseId } from 'util/graphql';
import type { ShortNameRowMutation } from './__generated__/ShortNameRowMutation.graphql';
import type {
  ShortNameRow_field$data,
  ShortNameRow_field$key,
} from './__generated__/ShortNameRow_field.graphql';

type Props = {
  field: ShortNameRow_field$key,
};

export default function ShortNameRow({ field }: Props): React.Node {
  const { id, shortName }: ShortNameRow_field$data = useFragment(
    graphql`
      fragment ShortNameRow_field on field {
        id
        shortName: short_name
      }
    `,
    field,
  );

  const [commit] = useMutation<ShortNameRowMutation>(
    graphql`
      mutation ShortNameRowMutation($dbId: String!, $newShortName: String!) {
        update_field_by_pk(
          pk_columns: { id: $dbId }
          _set: { short_name: $newShortName }
        ) {
          id
          shortName: short_name
        }
      }
    `,
  );

  const onChange = React.useCallback(
    newShortName => {
      commit({
        variables: {
          dbId: relayIdToDatabaseId(id),
          newShortName,
        },
      });
      analytics.track('Edit row in indicator details page', {
        row: 'shortName',
      });
    },
    [commit, id],
  );

  return (
    <FieldDetailsListItem
      title={I18N.text('Short name')}
      tooltipText={I18N.text(
        'The short name will appear in the hierarchical selectors in AQT',
        'shortNameHelpText',
      )}
    >
      <EditableTextValue onChange={onChange} value={shortName} />
    </FieldDetailsListItem>
  );
}
