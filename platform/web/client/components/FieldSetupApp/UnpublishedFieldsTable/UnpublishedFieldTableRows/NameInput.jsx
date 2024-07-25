// @flow
import * as React from 'react';
import { useFragment, useMutation } from 'react-relay/hooks';

import EditableTextInput from 'components/DataCatalogApp/common/EditableTextInput';
import { relayIdToDatabaseId } from 'util/graphql';
import type { NameInput_unpublishedField$key } from './__generated__/NameInput_unpublishedField.graphql';

type Props = {
  unpublishedFieldRef: NameInput_unpublishedField$key,
};

/** Uncontrolled component that manages name inputs and commits changes. */
export default function NameInput({
  unpublishedFieldRef,
}: Props): React.Element<typeof EditableTextInput> {
  const data = useFragment(
    graphql`
      fragment NameInput_unpublishedField on unpublished_field {
        id
        name
      }
    `,
    unpublishedFieldRef,
  );

  const [commit] = useMutation(
    graphql`
      mutation NameInputMutation($fieldId: String!, $name: String) {
        update_unpublished_field_by_pk(
          pk_columns: { id: $fieldId }
          _set: { name: $name }
        ) {
          id
          name
        }
      }
    `,
  );

  const { id: fieldId, name = '' } = data;

  const currentName = name || '';

  const currentNameValueRef = React.useRef(currentName);

  // Update editableName if the fragment name updates.
  React.useEffect(() => {
    currentNameValueRef.current = name || '';
  }, [name]);

  const onNameChange = React.useCallback(() => {
    const newName =
      currentNameValueRef.current !== '' ? currentNameValueRef.current : null;
    if (currentName !== newName) {
      commit({
        optimisticUpdater: store => {
          const fieldRecord = store.get(fieldId);
          if (fieldRecord) {
            fieldRecord.setValue(newName, 'name');
          }
        },
        variables: {
          fieldId: relayIdToDatabaseId(fieldId),
          name: newName,
        },
      });
    }
  }, [commit, currentName, fieldId]);

  return (
    <EditableTextInput
      currentValueRef={currentNameValueRef}
      editing
      initialValue={currentName}
      onBlur={onNameChange}
    />
  );
}
