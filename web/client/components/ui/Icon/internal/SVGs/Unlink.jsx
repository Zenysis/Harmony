// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function Unlink(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5.11 7.445L2 4.335l1.41-1.41 16.74 16.74-1.41 1.41-4.01-4.01H13v-1.73l-2.27-2.27H8v-2h.73l-2.07-2.07a3.097 3.097 0 00-2.76 3.07c0 1.71 1.39 3.1 3.1 3.1h4v1.9H7c-2.76 0-5-2.24-5-5 0-2.09 1.29-3.88 3.11-4.62zM17 7.065h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.27-.77 2.37-1.87 2.84l1.4 1.4a4.986 4.986 0 002.37-4.24c0-2.76-2.24-5-5-5zm-2.61 4l1.61 1.61v-1.61h-1.61z"
        fill="currentColor"
      />
    </svg>
  );
}
