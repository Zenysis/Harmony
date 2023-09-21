// @flow
import * as React from 'react';

type Props = {
  height: string | number,
  width: string | number,
};

/**
 * The PlaceholderItem component helps the user see where the item they are
 * dragging will end up if they stop dragging. It is a simple rectangle with a
 * background color.
 */
export default function PlaceholderItem({
  height,
  width,
}: Props): React.Element<'div'> {
  const style = {
    backgroundColor: 'rgba(155, 89, 182, 0.15)', // $aqt-purple-2 with opacity
    height,
    width,
  };
  return <div style={style} />;
}
