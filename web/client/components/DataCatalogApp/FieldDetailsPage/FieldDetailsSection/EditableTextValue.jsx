// @flow
import * as React from 'react';

import EditableItemControls from 'components/DataCatalogApp/common/EditableItemControls';
import EditableTextInput from 'components/DataCatalogApp/common/EditableTextInput';

type Props = {
  onChange: string => void,
  value: string,

  multiline?: boolean,
};

function EditableTextValue({ onChange, value, multiline = false }: Props) {
  const [editing, setEditing] = React.useState(false);
  const currentValueRef = React.useRef(value);

  const onCancelClick = React.useCallback(() => {
    currentValueRef.current = value;
    setEditing(false);
  }, [value]);

  const onSubmitClick = React.useCallback(() => {
    if (currentValueRef.current !== value) {
      onChange(currentValueRef.current);
    }
    setEditing(false);
  }, [onChange, value]);

  return (
    <div className="editable-text-value">
      <div className="editable-text-value__text-block">
        <EditableTextInput
          currentValueRef={currentValueRef}
          editing={editing}
          initialValue={value}
          multiline={multiline}
        />
      </div>
      <EditableItemControls
        editing={editing}
        onEditClick={() => setEditing(true)}
        onCancelClick={onCancelClick}
        onSubmitClick={onSubmitClick}
      />
    </div>
  );
}

export default (React.memo<Props>(
  EditableTextValue,
): React.AbstractComponent<Props>);
