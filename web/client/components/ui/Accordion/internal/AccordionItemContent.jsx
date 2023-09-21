// @flow
import * as React from 'react';

import AnimateHeight from 'components/ui/AnimateHeight';

type Props = {
  children: React.Node,
  isActive: boolean,
};

function AccordionItemContent({ children, isActive }: Props): React.Node {
  const height = isActive ? 'auto' : 0;

  return (
    <AnimateHeight height={height}>
      <div className="zen-accordion-item-content-wrapper">{children}</div>
    </AnimateHeight>
  );
}

export default (React.memo(
  AccordionItemContent,
): React.AbstractComponent<Props>);
