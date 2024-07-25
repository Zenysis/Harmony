// @flow
import * as React from 'react';

type Props = {
  children: React.Node,
  className?: string,
  title: string,
};

export default function IndicatorSectionRow({
  children,
  className = '',
  title,
}: Props): React.Element<'div'> {
  return (
    <div className={`indicator-section-row ${className}`}>
      <div className="indicator-section-row__title">{title}</div>
      <div className="indicator-section-row__value">{children}</div>
    </div>
  );
}
