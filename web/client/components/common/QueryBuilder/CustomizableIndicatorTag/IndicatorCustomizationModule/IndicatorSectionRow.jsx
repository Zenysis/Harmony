// @flow
import * as React from 'react';

type Props = {
  children: React.Node,
  title: string,

  className?: string,
};

export default function IndicatorSectionRow({
  children,
  title,

  className = '',
}: Props): React.Element<'div'> {
  return (
    <div className={`indicator-section-row ${className}`}>
      <div className="indicator-section-row__title">{title}</div>
      <div className="indicator-section-row__value">{children}</div>
    </div>
  );
}
