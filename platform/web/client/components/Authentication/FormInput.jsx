// @flow

import React from 'react';

import Group from 'components/ui/Group';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';

type FormInputProps = {
  disabled?: boolean,
  error: string | void,
  id: string,
  labelText: string,
  onChange: (value: string) => void,
  type: 'text' | 'password' | 'email' | 'number',
  value: string,
};

const FormInput = ({
  disabled = false,
  error,
  id,
  labelText,
  onChange,
  type,
  value,
}: FormInputProps): React$Node => {
  return (
    <Group.Vertical
      className={`${error ? 'has-error' : ''}`}
      firstItemStyle={{ marginBottom: 0 }}
    >
      <LabelWrapper htmlFor={id} label={labelText}>
        <InputText
          className="form-control"
          disabled={disabled}
          id={id}
          onChange={onChange}
          type={type}
          value={value}
        />
      </LabelWrapper>
      {error && <p className="help-block">{error}</p>}
    </Group.Vertical>
  );
};

export default FormInput;
