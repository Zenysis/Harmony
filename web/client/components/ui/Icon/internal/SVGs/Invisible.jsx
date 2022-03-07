// @flow
import * as React from 'react';

import type { SVGProps } from 'components/ui/Icon/internal/SVGs/types';

// This icon will take up the space of a normal icon but will not draw any
// content. It is useful in situations where an Icon is needed and should be
// planned for in the layout but no content should be drawn.
export default function Invisible(props: SVGProps): React.Element<'svg'> {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    />
  );
}
