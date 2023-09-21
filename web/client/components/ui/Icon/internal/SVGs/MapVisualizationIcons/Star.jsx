// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function Star(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      height="21"
      viewBox="0 0 21 21"
      width="21"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect fill="none" height="21" width="21" x="0" y="0" />
      <path
        d="M7.5,0l-2,5h-5l4,3.5l-2,6l5-3.5
	l5,3.5l-2-6l4-3.5h-5L7.5,0z"
        fill="currentColor"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
        transform="translate(3 3)"
      />
      <path
        d="M7.5,0l-2,5h-5l4,3.5l-2,6l5-3.5
	l5,3.5l-2-6l4-3.5h-5L7.5,0z"
        fill="currentColor"
        transform="translate(3 3)"
      />
    </svg>
  );
}
