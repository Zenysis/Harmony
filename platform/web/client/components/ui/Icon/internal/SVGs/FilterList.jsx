// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function FilterList(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        clipRule="evenodd"
        d="M3 6V8H21V6H3ZM10 18H14V16H10V18ZM18 13H6V11H18V13Z"
        fill="currentColor"
        fillOpacity="0.54"
        fillRule="evenodd"
      />
    </svg>
  );
}
