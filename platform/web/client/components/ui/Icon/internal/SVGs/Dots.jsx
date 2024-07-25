// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function Dots(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill="currentColor">
        <path d="M0 0h24v24H0V0z" fill="none" />
        <g>
          <circle cx="7" cy="14" r="3" />
          <circle cx="11" cy="6" r="3" />
          <circle cx="16.6" cy="17.6" r="3" />
        </g>
      </g>
    </svg>
  );
}
