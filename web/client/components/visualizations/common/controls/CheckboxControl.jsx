// @flow
import * as React from 'react';
import classnames from 'classnames';

import Checkbox from 'components/ui/Checkbox';
import Control from 'components/visualizations/common/controls/Control';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props = {
  ...VisualizationControlProps<boolean>,
  label: string,
  checkboxClassName?: string,
  labelAfter?: boolean,
  labelClassName?: string,
  labelInline?: boolean,
};

export default function CheckboxControl({
  controlKey,
  onValueChange,
  value,
  label,
  className = '',
  checkboxClassName = '',
  labelAfter = true,
  labelClassName = '',
  labelInline = true,
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
        id={controlKey}
        value={value}
        onChange={onChange}
        className={checkboxClassName}
      />
    </Control>
  );
}
