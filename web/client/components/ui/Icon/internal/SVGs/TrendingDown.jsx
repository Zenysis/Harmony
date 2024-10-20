// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function TrendingDown(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      height="24px"
      viewBox="0 0 24 24"
      width="24px"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  );
}
