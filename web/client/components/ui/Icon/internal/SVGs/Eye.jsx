// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function Eye(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      fill="none"
      height="10"
      viewBox="0 0 16 10"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        clipRule="evenodd"
        d="M0.666504 5C1.81984 2.07333 4.6665 0 7.99984 0C11.3332 0 14.1798 2.07333 15.3332 5C14.1798 7.92667 11.3332 10 7.99984 10C4.6665 10 1.81984 7.92667 0.666504 5ZM13.8798 5C12.7798 2.75333 10.5265 1.33333 7.99984 1.33333C5.47317 1.33333 3.21984 2.75333 2.11984 5C3.21984 7.24667 5.4665 8.66667 7.99984 8.66667C10.5332 8.66667 12.7798 7.24667 13.8798 5ZM7.99984 3.33333C8.91984 3.33333 9.6665 4.08 9.6665 5C9.6665 5.92 8.91984 6.66667 7.99984 6.66667C7.07984 6.66667 6.33317 5.92 6.33317 5C6.33317 4.08 7.07984 3.33333 7.99984 3.33333ZM4.99984 5C4.99984 3.34667 6.3465 2 7.99984 2C9.65317 2 10.9998 3.34667 10.9998 5C10.9998 6.65333 9.65317 8 7.99984 8C6.3465 8 4.99984 6.65333 4.99984 5Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}
