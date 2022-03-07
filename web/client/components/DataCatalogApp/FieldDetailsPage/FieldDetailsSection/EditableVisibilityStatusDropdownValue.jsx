// @flow
import * as React from 'react';

import EditableItemControls from 'components/DataCatalogApp/common/EditableItemControls';
import EditableVisibilityStatusDropdownInput from 'components/DataCatalogApp/common/EditableVisibilityStatusDropdownInput';
import type { VisibilityStatus } from 'models/core/DataCatalog/constants';

type Props = {
  onChange: string => void,
  value: VisibilityStatus,
};

export default function EditableVisibilityStatusDropdownValue({
  onChange,
  value,
}: Props): React.Element<'div'> {
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
    <div className="editable-visibility-status-dropdown-value">
      <div className="editable-visibility-status-dropdown-value__dropdown">
        <EditableVisibilityStatusDropdownInput
          currentValueRef={currentValueRef}
          editing={editing}
          initialValue={value}
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
