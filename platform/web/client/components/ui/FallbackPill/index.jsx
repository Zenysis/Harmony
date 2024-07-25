// @flow
import * as React from 'react';

import type { StyleObject } from 'types/jsCore';

type Props = {
  containerHeight?: number | void,
  height: number,
  style?: StyleObject | void,
  width?: number | void,
};

/**
 * The FallbackPill component renders a shimmering placeholder that indicates to
 * the user that content is still loading.
 */
export default function FallbackPill({
  height,

  containerHeight = undefined,
  style = undefined,
  width = undefined,
}: Props): React.Element<'div'> {
  const verticalMargin =
    containerHeight !== undefined ? (containerHeight - height) / 2 : 0;

  const pillStyle = {
    height,
    width,
    borderRadius: height,
    margin: `${verticalMargin}px 0`,
    ...style,
  };

  return <div className="fallback-pill" style={pillStyle} />;
}
