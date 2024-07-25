// @flow
import * as React from 'react';

import Tag from 'components/ui/Tag';

type Props = {
  className?: string,
  label: string,
};

export default function StaticPill({
  className = '',
  label,
}: Props): React.Node {
  const pillClassName = `admin-app-static-pill ${className}`;
  return (
    <Tag.Simple className={pillClassName} size={Tag.Sizes.SMALL}>
      {label}
    </Tag.Simple>
  );
}
