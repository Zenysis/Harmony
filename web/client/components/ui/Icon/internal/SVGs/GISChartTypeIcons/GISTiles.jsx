// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function GISTiles(props: SVGProps): React.Element<'svg'> {
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
      <path
        opacity="0.7"
        d="M5.33334 10.3333C5.33334 7.57191 7.57191 5.33333 10.3333 5.33333H12V12H5.33334V10.3333Z"
        fill="#3597E4"
      />
      <path
        d="M5.33334 12H12V18.6667H10.3333C7.57191 18.6667 5.33334 16.4281 5.33334 13.6667V12Z"
        fill="#3597E4"
      />
      <rect
        opacity="0.9"
        x="12"
        y="5.33333"
        width="6.66667"
        height="6.66667"
        fill="#3597E4"
      />
      <path
        opacity="0.5"
        d="M12 12H18.6667V13.6667C18.6667 16.4281 16.4281 18.6667 13.6667 18.6667H12V12Z"
        fill="#3597E4"
      />
    </svg>
  );
}
