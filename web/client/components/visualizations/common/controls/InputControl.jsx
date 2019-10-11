// @flow
import * as React from 'react';

import Control from 'components/visualizations/common/controls/Control';
import InputText from 'components/ui/InputText';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props = VisualizationControlProps<string> & {
  label: string,

  className: string,
  initialValue: string,
  inputClassName: string,
};

const defaultProps = {
  ...Control.defaultColumnCounts,
  className: '',
  initialValue: undefined,
  inputClassName: '',
  value: undefined,
};

export default function InputControl(props: Props) {
  const {
    controlKey,
    onValueChange,
    value,
    initialValue,
    label,
    className,
    inputClassName,
    ...passThroughControlProps
  } = props;
  const onChange = val => onValueChange(controlKey, val);

  return (
    <Control className={className} label={label} {...passThroughControlProps}>
      <InputText.Uncontrolled
        debounce={initialValue !== undefined}
        initialValue={initialValue}
        value={value}
        onChange={onChange}
        className={inputClassName}
      />
    </Control>
  );
}

InputControl.defaultProps = defaultProps;
