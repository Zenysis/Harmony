// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function IFrame(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <g fill="currentColor">
        <path d="M9.5 8.5L11 10l-3 3 3 3-1.5 1.5L5 13l4.5-4.5m5 9L13 16l3-3-3-3 1.5-1.5L19 13l-4.5 4.5M21 2H3a2 2 0 00-2 2v16a2 2 0 002 2h18a2 2 0 002-2V4a2 2 0 00-2-2m0 18H3V6h18v14z" />
        <path fill="rgba(0, 0, 0, 0)" d="M0 0h24v24H0z" />
      </g>
    </svg>
  );
}
