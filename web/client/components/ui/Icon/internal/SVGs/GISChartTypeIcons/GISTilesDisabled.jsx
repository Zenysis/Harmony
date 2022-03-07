// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function GISTilesDisabled(
  props: SVGProps,
): React.Element<'svg'> {
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
        fill="#E9E9E9"
      />
      <path
        opacity="0.7"
        d="M5.33337 10.3334C5.33337 7.57195 7.57195 5.33337 10.3334 5.33337H12V12H5.33337V10.3334Z"
        fill="#BFC2C9"
      />
      <path
        d="M5.33337 12H12V18.6667H10.3334C7.57195 18.6667 5.33337 16.4281 5.33337 13.6667V12Z"
        fill="#BFC2C9"
      />
      <rect
        opacity="0.9"
        x="12"
        y="5.33337"
        width="6.66667"
        height="6.66667"
        fill="#BFC2C9"
      />
      <path
        opacity="0.5"
        d="M12 12H18.6667V13.6667C18.6667 16.4281 16.4281 18.6667 13.6667 18.6667H12V12Z"
        fill="#BFC2C9"
      />
    </svg>
  );
}
