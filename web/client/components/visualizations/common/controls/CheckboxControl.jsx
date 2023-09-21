// @flow
import * as React from 'react';
import classnames from 'classnames';

import Checkbox from 'components/ui/Checkbox';
import Control from 'components/visualizations/common/controls/Control';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props = {
  ...VisualizationControlProps<boolean>,
  checkboxClassName?: string,
  disabled?: boolean,
  label: string,
  labelAfter?: boolean,
  labelClassName?: string,
  labelInline?: boolean,
};

export default function CheckboxControl({
  checkboxClassName = '',
  className = '',
  controlKey,
  disabled = false,
  label,
  labelAfter = true,
  labelClassName = '',
  labelInline = true,
  onValueChange,
  value,
}: Props): React.Node {
  const onChange = val => onValueChange(controlKey, val);

  const fullClassname = classnames(className, {
    'settings-modal-checkbox-control--inline': labelInline,
  });

  return (
    <Control
      className={fullClassname}
      htmlFor={controlKey}
      label={label}
      labelAfter={labelAfter}
      labelClassName={`${labelClassName} settings-modal-checkbox-control__label`}
      labelInline={labelInline}
    >
      <Checkbox
        className={checkboxClassName}
        disabled={disabled}
        id={controlKey}
        onChange={onChange}
        value={value}
      />
    </Control>
  );
}
