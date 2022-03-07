// @flow
import * as React from 'react';

import LabelWrapper from 'components/ui/LabelWrapper';

type Props = {
  children: React.Node,

  className?: string,
  htmlFor?: string,
  label?: React.Node,
  labelAfter?: boolean,
  labelInline?: boolean,
  labelClassName?: string,
  testId?: string,
};

/**
 * <Control> represents a single control (e.g. InputText, Dropdown, etc.)
 * grouped together with its label.
 */
export default function Control({
  children,
  label = undefined,
  className = '',
  htmlFor = undefined,
  labelAfter = false,
  labelInline = false,
  labelClassName = '',
  testId = undefined,
}: Props): React.Node {
  if (label) {
    return (
      <LabelWrapper
        className={className}
        htmlFor={htmlFor}
        inline={labelInline}
        label={label}
        labelAfter={labelAfter}
        labelClassName={`settings-modal__control-label ${labelClassName}`}
        testId={testId}
      >
        {children}
      </LabelWrapper>
    );
  }

  return <div className={className}>{children}</div>;
}
