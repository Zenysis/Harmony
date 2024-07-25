// @flow
import * as React from 'react';
import classNames from 'classnames';

import Icon from 'components/ui/Icon';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import type { IconType } from 'components/ui/Icon/types';
import type { Intent } from 'components/ui/Intents';
import type { StyleObject } from 'types/jsCore';

type Props = {
  /** The accessibility name for this icon button. */
  ariaName?: string,

  /** Optional additional class name to add to the button. */
  className?: string,

  /** The intent is 'primary', 'danger', or 'success'. */
  intent?: Intent,

  /**
   * Gets called when the button is clicked.
   * @param {SyntheticEvent.button} event The click event
   */
  onClick?: (event: SyntheticMouseEvent<HTMLDivElement>) => void,

  /** Optional inline styling for button. */
  style?: StyleObject,

  /**
   * This gets added as a `data-testid` attribute on the IconButtons div. Use this only
   * when you need to locate a IconButton in a webdriver test.
   */
  testId?: string,

  /**
   * A valid glyphicon suffix. You can find all glyphicons here:
   * https://getbootstrap.com/docs/3.3/components/
   *
   * Available types are listed in `components/ui/Icon/types`
   * */
  type: IconType,
};

/**
 * An IconButton component to render any valid Icon as a responsive button.
 * For glyphicons, the `type` prop is a glyphicon suffix taken from this list:
 * https://getbootstrap.com/docs/3.3/components/
 *
 * For SVGs, the type prop is key of `SVG_MAP` in
 * `components/ui/Icon/internal/SVGs/index.jsx`.
 */
export default function IconButton({
  ariaName = undefined,
  className = '',
  intent = undefined,
  onClick = undefined,
  style = undefined,
  testId = undefined,
  type,
}: Props): React.Element<'div'> {
  const fullClassName = classNames(className, 'zen-icon-button', {
    [`zen-icon-button--${intent}`]: intent !== undefined,
  });

  return (
    <div
      aria-label={normalizeARIAName(ariaName)}
      className={fullClassName}
      data-testid={testId}
      onClick={onClick}
      role="button"
      style={style}
    >
      <Icon type={type} />
    </div>
  );
}
