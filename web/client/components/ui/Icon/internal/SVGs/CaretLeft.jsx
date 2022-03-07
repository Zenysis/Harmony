// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function CaretLeft(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      height="24"
      width="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M24 0v24H0V0h24z" fill="none" opacity=".87" />
      <path d="M14 7l-5 5 5 5V7z" fill="currentColor" />
    </svg>
  );
}
