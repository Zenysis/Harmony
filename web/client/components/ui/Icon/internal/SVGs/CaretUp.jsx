// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function CaretUp(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      height="24"
      width="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path d="M7 14l5-5 5 5H7z" fill="currentColor" />
    </svg>
  );
}
