// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function Bar(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      {...props}
    >
      <g fill="currentColor">
        <path d="M0 0h24v24H0z" fill="none" />
        <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
      </g>
    </svg>
  );
}
