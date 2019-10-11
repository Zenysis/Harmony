// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import Control from 'components/visualizations/common/controls/Control';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props = VisualizationControlProps<boolean> & {
  label: string,

  checkboxClassName: string,
  labelClassName: string,
};

const defaultProps = {
  ...Control.defaultColumnCounts,
  checkboxClassName: '',
  labelClassName: '',
};

export default function CheckboxControl(props: Props) {
  const {
    checkboxClassName,
    controlKey,
    onValueChange,
    value,
    labelClassName,
    ...passThroughControlProps
  } = props;
  const onChange = val => onValueChange(controlKey, val);

  return (
    <Control
      htmlFor={controlKey}
      labelClassName={labelClassName}
      {...passThroughControlProps}
    >
      <Checkbox
        id={controlKey}
        value={value}
        onChange={onChange}
        className={checkboxClassName}
      />
    </Control>
  );
}

CheckboxControl.defaultProps = defaultProps;
