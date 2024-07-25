// @flow
import * as React from 'react';

import type { StyleObject } from 'types/jsCore';

type Props = {
  name: string,
  cssVar: string,
  darkText: boolean,

  hexcode?: string,
  style?: StyleObject,
};

/**
 * This is a simple box used exclusively in our styleguide to illustrate our
 * CSS color variables.
 */
export default function Box({
  name,
  cssVar,
  darkText,
  hexcode = undefined,
  style = undefined,
}: Props): React.Element<'div'> {
  const pStyle = darkText ? undefined : { color: 'white' };
  const divStyle = style || { backgroundColor: hexcode };
  return (
    <div style={{ height: 120, width: 220, padding: 12, ...divStyle }}>
      <p style={pStyle}>{name}</p>
      <p style={pStyle}>
        <code>{cssVar}</code>
      </p>
      <p style={pStyle}>
        <code>{hexcode}</code>
      </p>
    </div>
  );
}
