// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function Correlation(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      height="24"
      viewBox="0 0 32 32"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill="currentColor">
        <path d="M4.558 27.442a.625.625 0 010-.884l22-22a.625.625 0 11.884.884l-22 22a.625.625 0 01-.884 0zM6 20.75a.75.75 0 100-1.5.75.75 0 000 1.5zM6 22a2 2 0 100-4 2 2 0 000 4zM20 19.75a.75.75 0 100-1.5.75.75 0 000 1.5zM20 21a2 2 0 100-4 2 2 0 000 4zM10.5 13.75a.25.25 0 100-.5.25.25 0 000 .5zm0 1.25a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM26 13.75a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5zM26 15a3 3 0 100-6 3 3 0 000 6zM16 9.75a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5zM16 11a3 3 0 100-6 3 3 0 000 6zM7 7.75a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5zM7 9a3 3 0 100-6 3 3 0 000 6zM13 26.75a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5zM13 28a3 3 0 100-6 3 3 0 000 6zM25 26.75a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5zM25 28a3 3 0 100-6 3 3 0 000 6z" />
      </g>
    </svg>
  );
}
