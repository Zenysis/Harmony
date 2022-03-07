// @flow
import * as React from 'react';

import type { StyleObject } from 'types/jsCore';

type Props = {
  height: number,

  containerHeight?: number | void,
  style?: StyleObject | void,
  width?: number | void,
};

/**
 * The FallbackPill component renders a shimmering placeholder that indicates to
 * the user that content is still loading.
 *
 * NOTE(stephen): There is likely a common *ui* component that we could build
 * that would look similar to this. I just don't have enough insight into the
 * usages of the component to commit to placing this in the ui lib right now.
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
    borderRadius: height,
    margin: `${verticalMargin}px 0`,
    height,
    width,
    ...style,
  };

  return <div className="dc-fallback-pill" style={pillStyle} />;
}
