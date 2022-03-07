// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function CaretRight(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      height="24"
      width="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M10 17l5-5-5-5v10z" fill="currentColor" />
      <path d="M0 24V0h24v24H0z" fill="none" />
    </svg>
  );
}
