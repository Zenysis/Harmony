// @flow
import * as React from 'react';

import Card from 'components/ui/Card';

type Props = {
  children: React.Node,
  className?: string,

  helpText?: string,
  title: string,
};

/**
 * A Card wrapper to hold configurations
 */
export default function ConfigurationBlock({
  children,
  className = '',
  helpText = '',
  title,
}: Props): React.Node {
  return (
    <Card
      className={`configuration-tab__card ${className}`}
      headingBackground="offwhite"
      helpText={helpText}
      title={title}
    >
      {children}
    </Card>
  );
}
