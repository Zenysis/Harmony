// @flow
import * as React from 'react';

import Control from 'components/visualizations/common/controls/Control';
import RadioGroup from 'components/common/RadioGroup';
import type { RadioItem } from 'components/common/RadioGroup';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props<T> = VisualizationControlProps<T> & {
  children: React.ChildrenArray<React.Element<React.ComponentType<RadioItem>>>,
  label: string,

  radioGroupClassName: string,
  className: string,
};

const defaultProps = {
  ...Control.defaultColumnCounts,
  className: '',
  radioGroupClassName: '',
};

export default function RadioControl<T>(props: Props<T>) {
  const {
    radioGroupClassName,
    children,
    controlKey,
    onValueChange,
    value,
    ...passThroughControlProps
  } = props;
  const onChange = val => onValueChange(controlKey, val);

  return (
    <Control htmlFor={controlKey} {...passThroughControlProps}>
      <RadioGroup
        id={controlKey}
        value={value}
        onChange={onChange}
        className={radioGroupClassName}
      >
        {children}
      </RadioGroup>
    </Control>
  );
}

RadioControl.defaultProps = defaultProps;
