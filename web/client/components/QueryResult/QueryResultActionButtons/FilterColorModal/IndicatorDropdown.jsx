// @flow
import * as React from 'react';
import Select from 'react-select';

import CustomField from 'models/core/Field/CustomField';
import LegacyField from 'models/core/Field';

type Props = {
  fields: $ReadOnlyArray<LegacyField | CustomField>,
  selectedFieldId: string,
  onIndicatorChange: (fieldSelection: { value: string }) => void,
};

// TODO(pablo): when we upgrade to React v16.8 use React.memo to wrap this
// component
export default function IndicatorDropdown(props: Props) {
  // TODO(pablo): when we upgrade to React v16.8 we should use hooks to memoize
  // the fieldOptions construction
  const fieldOptions = props.fields.map(field => ({
    value: field.id(),
    label: field.label(),
    clearableValue: false,
  }));

  // TODO(pablo): switch this to our internal Dropdown component so that we can
  // remove the use of react-select from our codebase
  return (
    <div className="form-group">
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label className="modal-form-field-label">Fields</label>
      <Select
        name="form-field-name"
        clearable={false}
        options={fieldOptions}
        backspaceRemoves={false}
        value={props.selectedFieldId}
        onChange={props.onIndicatorChange}
      />
    </div>
  );
}
