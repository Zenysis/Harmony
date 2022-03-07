// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function HashTag(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      height="32"
      width="32"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect fill="none" height="32" width="32" />
      <path d="M28,12V10H22V4H20v6H12V4H10v6H4v2h6v8H4v2h6v6h2V22h8v6h2V22h6V20H22V12Zm-8,8H12V12h8Z" />
    </svg>
  );
}
