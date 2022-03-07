// @flow
import * as React from 'react';
import { useFragment, useMutation } from 'react-relay/hooks';

import EditableTextValue from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/EditableTextValue';
import FieldDetailsListItem from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/FieldDetailsListItem';
import { relayIdToDatabaseId } from 'util/graphql';
import type { NameRowMutation } from './__generated__/NameRowMutation.graphql';
import type {
  NameRow_field$data,
  NameRow_field$key,
} from './__generated__/NameRow_field.graphql';

type Props = {
  field: NameRow_field$key,
};

const TEXT = {
  title: 'Name',
};

export default function NameRow({ field }: Props): React.Node {
  const { id, name }: NameRow_field$data = useFragment(
    graphql`
      fragment NameRow_field on field {
        id
        name
      }
    `,
    field,
  );

  const [commit] = useMutation<NameRowMutation>(
    graphql`
      mutation NameRowMutation($dbId: String!, $newName: String!) {
        update_field_by_pk(
          pk_columns: { id: $dbId }
          _set: { name: $newName }
        ) {
          id
          name
        }
      }
    `,
  );

  const onChange = React.useCallback(
    newName => {
      commit({
        variables: {
          dbId: relayIdToDatabaseId(id),
          newName,
        },
      });
      analytics.track('Edit row in indicator details page', {
        row: 'name',
      });
    },
    [commit, id],
  );

  return (
    <FieldDetailsListItem title={TEXT.title}>
      <EditableTextValue onChange={onChange} value={name} />
    </FieldDetailsListItem>
  );
}
