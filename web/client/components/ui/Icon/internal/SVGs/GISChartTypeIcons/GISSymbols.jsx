// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function GISSymbols(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M0 5C0 2.23858 2.23858 0 5 0H19C21.7614 0 24 2.23858 24 5V19C24 21.7614 21.7614 24 19 24H5C2.23858 24 0 21.7614 0 19V5Z"
        fill="#E8F0FF"
      />
      <circle cx="16" cy="16" r="2.66667" fill="#3597E4" />
      <rect
        x="5.33333"
        y="5.33333"
        width="5.33333"
        height="5.33333"
        fill="#3597E4"
      />
      <path
        d="M16 5.33333L18.3094 9.33333H13.6906L16 5.33333Z"
        fill="#3597E4"
      />
      <path
        d="M8 13.3333L8.5987 15.176H10.5362L8.96872 16.3148L9.56743 18.1574L8 17.0186L6.43257 18.1574L7.03128 16.3148L5.46385 15.176H7.4013L8 13.3333Z"
        fill="#3597E4"
      />
    </svg>
  );
}
