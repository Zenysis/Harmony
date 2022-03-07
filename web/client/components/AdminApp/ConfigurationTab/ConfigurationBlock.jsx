// @flow
import * as React from 'react';

import Card from 'components/ui/Card';

type Props = {
  children: React.Node,
  title: string,

  className?: string,
  helpText?: string,
};

/**
 * A Card wrapper to hold configurations
 */
export default function ConfigurationBlock({
  children,
  title,
  helpText = '',
  className = '',
}: Props): React.Node {
  return (
    <Card
      className={`configuration-tab__card ${className}`}
      title={title}
      headingBackground="offwhite"
      helpText={helpText}
    >
      {children}
    </Card>
  );
}
