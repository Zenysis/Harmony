// @flow
import * as React from 'react';

import Tag from 'components/ui/Tag';

type Props = {
  label: string,

  className?: string,
};

export default function StaticPill({
  label,
  className = '',
}: Props): React.Node {
  const pillClassName = `admin-app-static-pill ${className}`;
  return (
    <Tag.Simple className={pillClassName} size={Tag.Sizes.SMALL}>
      {label}
    </Tag.Simple>
  );
}
