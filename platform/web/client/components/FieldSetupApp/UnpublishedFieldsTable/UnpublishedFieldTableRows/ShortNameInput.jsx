// @flow
import * as React from 'react';
import { useFragment, useMutation } from 'react-relay/hooks';

import EditableTextInput from 'components/DataCatalogApp/common/EditableTextInput';
import { relayIdToDatabaseId } from 'util/graphql';
import type { ShortNameInput_unpublishedField$key } from './__generated__/ShortNameInput_unpublishedField.graphql';

type Props = {
  unpublishedFieldRef: ShortNameInput_unpublishedField$key,
};

/** Uncontrolled component that manages short name inputs and commits changes. */
export default function ShortNameInput({
  unpublishedFieldRef,
}: Props): React.Element<typeof EditableTextInput> {
  const data = useFragment(
    graphql`
      fragment ShortNameInput_unpublishedField on unpublished_field {
        id
        shortName: short_name
      }
    `,
    unpublishedFieldRef,
  );

  const [commit] = useMutation(
    graphql`
      mutation ShortNameInputMutation($fieldId: String!, $shortName: String) {
        update_unpublished_field_by_pk(
          pk_columns: { id: $fieldId }
          _set: { short_name: $shortName }
        ) {
          id
          short_name
        }
      }
    `,
  );

  const { id: fieldId, shortName = '' } = data;

  const currentShortName = shortName || '';

  const currentShortNameValueRef = React.useRef(currentShortName);

  // Update editableShortName if the fragment short name updates.
  React.useEffect(() => {
    currentShortNameValueRef.current = shortName || '';
  }, [shortName]);

  const onShortNameChange = React.useCallback(() => {
    const newShortName =
      currentShortNameValueRef.current !== ''
        ? currentShortNameValueRef.current
        : null;
    if (currentShortName !== newShortName) {
      commit({
        optimisticUpdater: store => {
          const fieldRecord = store.get(fieldId);
          if (fieldRecord) {
            fieldRecord.setValue(newShortName, 'short_name');
          }
        },
        variables: {
          fieldId: relayIdToDatabaseId(fieldId),
          shortName: newShortName,
        },
      });
    }
  }, [commit, currentShortName, fieldId]);

  return (
    <EditableTextInput
      currentValueRef={currentShortNameValueRef}
      editing
      initialValue={currentShortName}
      onBlur={onShortNameChange}
    />
  );
}
