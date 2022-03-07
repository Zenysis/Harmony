// @flow
import * as React from 'react';
import { useFragment, useMutation } from 'react-relay/hooks';

import EditableTextValue from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/EditableTextValue';
import FieldDetailsListItem from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/FieldDetailsListItem';
import { relayIdToDatabaseId } from 'util/graphql';
import type { DescriptionRowMutation } from './__generated__/DescriptionRowMutation.graphql';
import type {
  DescriptionRow_field$data,
  DescriptionRow_field$key,
} from './__generated__/DescriptionRow_field.graphql';

type Props = {
  field: DescriptionRow_field$key,
};

const TEXT = {
  title: 'Description',
};

export default function DescriptionRow({ field }: Props): React.Node {
  const { description, id }: DescriptionRow_field$data = useFragment(
    graphql`
      fragment DescriptionRow_field on field {
        description
        id
      }
    `,
    field,
  );

  const [commit] = useMutation<DescriptionRowMutation>(
    graphql`
      mutation DescriptionRowMutation(
        $dbId: String!
        $newDescription: String!
      ) {
        update_field_by_pk(
          pk_columns: { id: $dbId }
          _set: { description: $newDescription }
        ) {
          id
          description
        }
      }
    `,
  );

  const onChange = React.useCallback(
    newDescription => {
      commit({
        variables: {
          dbId: relayIdToDatabaseId(id),
          newDescription,
        },
      });
      analytics.track('Edit row in indicator details page', {
        row: 'description',
      });
    },
    [commit, id],
  );

  return (
    <FieldDetailsListItem title={TEXT.title}>
      <EditableTextValue
        multiline
        onChange={onChange}
        value={description || ''}
      />
    </FieldDetailsListItem>
  );
}
