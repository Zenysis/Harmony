// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function Upload(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      {...props}
    >
      <path
        d="M3 9L3.705 9.705L7.5 5.915V15H8.5V5.915L12.295 9.705L13 9L8 4L3 9Z"
        fill="currentColor"
      />
      <path
        d="M3 4V2H13V4H14V2C14 1.73478 13.8946 1.48043 13.7071 1.29289C13.5196 1.10536 13.2652 1 13 1H3C2.73478 1 2.48043 1.10536 2.29289 1.29289C2.10536 1.48043 2 1.73478 2 2V4H3Z"
        fill="currentColor"
      />
    </svg>
  );
}
