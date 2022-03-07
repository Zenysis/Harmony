// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

export default function PeopleWithBackground(
  props: SVGProps,
): React.Element<'svg'> {
  return (
    <svg
      width="192"
      height="192"
      viewBox="0 0 192 192"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="96" cy="96" r="96" fill="#EFF1F5" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M81 101C90.65 101 98.5 93.15 98.5 83.5C98.5 73.85 90.65 66 81 66C71.35 66 63.5 73.85 63.5 83.5C63.5 93.15 71.35 101 81 101ZM46 127.25C46 115.6 69.3 109.75 81 109.75C92.7 109.75 116 115.6 116 127.25V136H46V127.25ZM81 119.75C72.05 119.75 61.9 123.1 57.7 126H104.3C100.1 123.1 89.95 119.75 81 119.75ZM88.5 83.5C88.5 79.35 85.15 76 81 76C76.85 76 73.5 79.35 73.5 83.5C73.5 87.65 76.85 91 81 91C85.15 91 88.5 87.65 88.5 83.5ZM116.2 110.05C122 114.25 126 119.85 126 127.25V136H146V127.25C146 117.15 128.5 111.4 116.2 110.05ZM128.5 83.5C128.5 93.15 120.65 101 111 101C108.3 101 105.8 100.35 103.5 99.25C106.65 94.8 108.5 89.35 108.5 83.5C108.5 77.65 106.65 72.2 103.5 67.75C105.8 66.65 108.3 66 111 66C120.65 66 128.5 73.85 128.5 83.5Z"
        fill="#BFC2C9"
      />
    </svg>
  );
}
