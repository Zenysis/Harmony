// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function DownloadOutline(props: SVGProps): React.Element<'svg'> {
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
        d="M19 9.5H15V3.5H9V9.5H5L12 16.5L19 9.5ZM11 11.5V5.5H13V11.5H14.17L12 13.67L9.83 11.5H11ZM19 20.5V18.5H5V20.5H19Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}
