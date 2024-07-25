// @flow
import * as React from 'react';

import Control from 'components/visualizations/common/controls/Control';
import InputText from 'components/ui/InputText';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props = {
  ...$Diff<VisualizationControlProps<string>, { value: mixed }>,
  ariaName?: string,
  className?: string,
  initialValue?: string,
  inputClassName?: string,
  label?: string,
  testId?: string,
  type?: 'text' | 'password' | 'email' | 'number',
};

export default function InputControl({
  controlKey,
  onValueChange,
  ariaName = undefined,
  className = '',
  initialValue = undefined,
  inputClassName = '',
  label = '',
  testId = undefined,
  type = 'text',
}: Props): React.Node {
  const onChange = val => onValueChange(controlKey, val);

  return (
    <Control className={className} label={label} testId={testId}>
      <InputText.Uncontrolled
        ariaName={ariaName}
        className={inputClassName}
        debounce={initialValue !== undefined}
        initialValue={initialValue}
        onChange={onChange}
        type={type}
      />
    </Control>
  );
}
