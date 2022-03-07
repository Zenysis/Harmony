// @flow
import * as React from 'react';

import Control from 'components/visualizations/common/controls/Control';
import RadioGroup from 'components/ui/RadioGroup';
import type { RadioItemElement } from 'components/ui/RadioGroup/RadioItem';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props<T> = {
  ...VisualizationControlProps<T>,
  children: React.ChildrenArray<RadioItemElement<T>>,

  className?: string,
  label?: $PropertyType<React.ElementConfig<typeof Control>, 'label'>,
  radioGroupClassName?: string,
};

export default function RadioControl<T: string>({
  children,
  controlKey,
  onValueChange,
  value,
  className = '',
  label = undefined,
  radioGroupClassName = '',
}: Props<T>): React.Node {
  const onChange = val => onValueChange(controlKey, val);

  return (
    <Control label={label} className={className}>
      <RadioGroup
        value={value}
        onChange={onChange}
        className={radioGroupClassName}
      >
        {children}
      </RadioGroup>
    </Control>
  );
}
