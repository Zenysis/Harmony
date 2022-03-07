// @flow
import * as React from 'react';

import Heading from 'components/ui/Heading';

type Props = {
  children: React.Node,
  title: string,
  className?: string,
  titleTooltip?: string | void,
};

export default function IndicatorCustomizationModuleBlock({
  children,
  title,
  className = '',
  titleTooltip = undefined,
}: Props): React.Node {
  return (
    <div className={`indicator-customization-module__block ${className}`}>
      <Heading.Small
        className="indicator-customization-module__block-title"
        infoTooltip={titleTooltip}
      >
        {title}
      </Heading.Small>
      {children}
    </div>
  );
}
