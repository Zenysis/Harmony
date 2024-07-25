// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import {
  VISIBILITY_STATUS_DISPLAY_VALUES_MAP,
  VISIBILITY_STATUS_VALUES,
} from 'models/core/DataCatalog/constants';
import type { VisibilityStatus } from 'models/core/DataCatalog/constants';

type Props = {
  currentValueRef: { current: VisibilityStatus },
  editing: boolean,
  initialValue: VisibilityStatus,
};

const dropdownOptions = VISIBILITY_STATUS_VALUES.map(status => (
  <Dropdown.Option key={status} value={status}>
    {VISIBILITY_STATUS_DISPLAY_VALUES_MAP[status]}
  </Dropdown.Option>
));

// The `EditableDropdownInput` component is an uncontrolled component. The current
// value of the dropdown can be retrieved by the parent through the
// `currentValueRef` prop. An uncontrolled component is a simpler interface
// for DataCatalog components to use since they don't need to handle debouncing
// or storage of the current value via callbacks.
export default function EditableVisibilityStatusDropdownInput({
  currentValueRef,
  editing,
  initialValue,
}: Props): React.Element<'div' | typeof Dropdown> {
  const [currentValue, setCurrentValue] = React.useState(initialValue);

  // Make sure the current value ref is always up-to-date.
  // eslint-disable-next-line no-param-reassign
  currentValueRef.current = currentValue;

  // If the initial value changes or the editing state changes, reset.
  React.useEffect(() => {
    setCurrentValue(initialValue);
  }, [editing, initialValue]);

  if (!editing) {
    return (
      <div className="editable-visibility-status-dropdown-input__text">
        {VISIBILITY_STATUS_DISPLAY_VALUES_MAP[initialValue]}
      </div>
    );
  }

  return (
    <Dropdown onSelectionChange={setCurrentValue} value={currentValue}>
      {dropdownOptions}
    </Dropdown>
  );
}
