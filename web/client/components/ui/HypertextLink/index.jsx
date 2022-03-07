// @flow
import * as React from 'react';

import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import type { StyleObject } from 'types/jsCore';

type Props = {
  children: React.Node,

  /** The URL that this link should navigate to */
  url: string,

  /**
   * The accessibility name for this link. If none is specified, we will
   * use the link contents if it is a string or number.
   */
  ariaName?: string,

  /** Optional additional class name to add to the link */
  className?: string,

  /** Highlight text in blue like a traditional hyperlink */
  highlight?: boolean,

  /**
   * Gets called when the link is clicked.
   * @param {SyntheticEvent.button} event The click event
   */
  onClick?: (event: SyntheticMouseEvent<HTMLButtonElement>) => void,

  /** Optional styling for link */
  style?: StyleObject,
};

/** A basic wrapper for hypertext links. */
export default function HypertextLink({
  children,
  url,
  ariaName = undefined,
  className = '',
  highlight = false,
  onClick = undefined,
  style = undefined,
}: Props): React.Element<'a'> {
  // if no ARIA Name was specified, use the button contents if it's a string
  const ariaNameToUse =
    ariaName ||
    (typeof children === 'string' || typeof children === 'number'
      ? String(children)
      : undefined);

  return (
    <a
      aria-label={normalizeARIAName(ariaNameToUse)}
      className={`zen-hypertext-link ${className} ${
        highlight ? 'u-highlighted-text' : ''
      }`}
      href={url}
      onClick={onClick}
      style={style}
    >
      {children}
    </a>
  );
}
