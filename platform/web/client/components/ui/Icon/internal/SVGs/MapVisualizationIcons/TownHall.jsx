// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function TownHall(props: SVGProps): React.Element<'svg'> {
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
        d="M7.5,0L1,3.4453V4h13V3.4453L7.5,0z M2,5v5l-1,1.5547V13h13v-1.4453L13,10V5H2z M4,6h1v5.5H4V6z M7,6h1v5.5H7
	V6z M10,6h1v5.5h-1V6z"
        fill="currentColor"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
        transform="translate(3 3)"
      />
      <path
        d="M7.5,0L1,3.4453V4h13V3.4453L7.5,0z M2,5v5l-1,1.5547V13h13v-1.4453L13,10V5H2z M4,6h1v5.5H4V6z M7,6h1v5.5H7
	V6z M10,6h1v5.5h-1V6z"
        fill="currentColor"
        transform="translate(3 3)"
      />
    </svg>
  );
}
