// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function Hospital(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 21 21"
      height="21"
      width="21"
      {...props}
    >
      <rect fill="none" x="0" y="0" width="21" height="21" />
      <path
        fill="currentColor"
        transform="translate(3 3)"
        d="M7,1C6.4,1,6,1.4,6,2v4H2C1.4,6,1,6.4,1,7v1
	c0,0.6,0.4,1,1,1h4v4c0,0.6,0.4,1,1,1h1c0.6,0,1-0.4,1-1V9h4c0.6,0,1-0.4,1-1V7c0-0.6-0.4-1-1-1H9V2c0-0.6-0.4-1-1-1H7z"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
      />
      <path
        fill="currentColor"
        transform="translate(3 3)"
        d="M7,1C6.4,1,6,1.4,6,2v4H2C1.4,6,1,6.4,1,7v1
	c0,0.6,0.4,1,1,1h4v4c0,0.6,0.4,1,1,1h1c0.6,0,1-0.4,1-1V9h4c0.6,0,1-0.4,1-1V7c0-0.6-0.4-1-1-1H9V2c0-0.6-0.4-1-1-1H7z"
      />
    </svg>
  );
}
