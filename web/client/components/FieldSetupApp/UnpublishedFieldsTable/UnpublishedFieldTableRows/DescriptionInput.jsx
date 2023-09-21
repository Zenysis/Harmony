// @flow
import * as React from 'react';
import { useFragment, useMutation } from 'react-relay/hooks';

import EditableTextInput from 'components/DataCatalogApp/common/EditableTextInput';
import { relayIdToDatabaseId } from 'util/graphql';
import type { DescriptionInput_unpublishedField$key } from './__generated__/DescriptionInput_unpublishedField.graphql';

type Props = {
  unpublishedFieldRef: DescriptionInput_unpublishedField$key,
};

/** Uncontrolled component that manages description inputs and commits changes. */
export default function DescriptionInput({
  unpublishedFieldRef,
}: Props): React.Element<typeof EditableTextInput> {
  const data = useFragment(
    graphql`
      fragment DescriptionInput_unpublishedField on unpublished_field {
        id
        description
      }
    `,
    unpublishedFieldRef,
  );

  const [commit] = useMutation(
    graphql`
      mutation DescriptionInputMutation(
        $description: String
        $fieldId: String!
      ) {
        update_unpublished_field_by_pk(
          pk_columns: { id: $fieldId }
          _set: { description: $description }
        ) {
          id
          description
        }
      }
    `,
  );

  const { description = '', id: fieldId } = data;

  const currentDescription = description || '';

  const currentDescriptionValueRef = React.useRef(currentDescription);

  // Update editableDescription if the fragment description updates.
  React.useEffect(() => {
    currentDescriptionValueRef.current = description || '';
  }, [description]);

  const onDescriptionChange = React.useCallback(() => {
    const newDescription =
      currentDescriptionValueRef.current !== ''
        ? currentDescriptionValueRef.current
        : null;
    if (currentDescription !== newDescription) {
      commit({
        optimisticUpdater: store => {
          const fieldRecord = store.get(fieldId);
          if (fieldRecord) {
            fieldRecord.setValue(newDescription, 'description');
          }
        },
        variables: {
          description: newDescription,
          fieldId: relayIdToDatabaseId(fieldId),
        },
      });
    }
  }, [commit, currentDescription, fieldId]);

  return (
    <EditableTextInput
      currentValueRef={currentDescriptionValueRef}
      editing
      initialValue={currentDescription}
      multiline
      onBlur={onDescriptionChange}
    />
  );
}
