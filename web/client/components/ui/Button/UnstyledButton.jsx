// @flow
import * as React from 'react';

import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import useCommonButtonSetup from 'components/ui/Button/useCommonButtonSetup';
import type { StyleObject } from 'types/jsCore';

type Props = {
  children: React.Node,

  /**
   * The accessibility name for this button. If none is specified, we will
   * use the button contents if it is a string or number.
   */
  ariaName?: string,

  /** Optional additional class name to add to the button */
  className?: string,

  /**
   * This gets added as a 'data-content' attribute on the button.
   *
   * TODO(nina): Switch to tooltip instead of data-content
   */
  dataContent?: string,

  /**
   * Disable the button. The `onClick` event will not fire if this is true
   */
  disabled?: boolean,

  /**
   * Gets called when the button is clicked.
   * @param {SyntheticEvent.button} event The click event
   */
  onClick?: (event: SyntheticMouseEvent<HTMLButtonElement>) => any,

  /** Optional styling for button */
  style?: StyleObject,

  /**
   * This gets added as a `data-testid` attribute on the button. Use this only
   * when you need to locate a button in a webdriver test. The xpath to locate
   * this button would be:
   *
   * `//button[@data-testid="yourTestId"]`
   */
  testId?: string,
};

/**
 * A basic, unstyled button component used to click things.
 * @visibleName Button.Unstyled
 */
export default function UnstyledButton({
  children,
  ariaName = undefined,
  className = '',
  dataContent = undefined,
  disabled = false,
  onClick = undefined,
  style = undefined,
  testId = undefined,
}: Props): React.Element<'button'> {
  const [onButtonClick, ariaNameToUse] = useCommonButtonSetup(
    ariaName,
    children,
    disabled,
    onClick,
  );

  return (
    <button
      aria-label={normalizeARIAName(ariaNameToUse)}
      data-content={dataContent}
      data-testid={testId}
      className={`zen-unstyled-button ${className}`}
      type="button"
      onClick={onButtonClick}
      style={style}
    >
      {children}
    </button>
  );
}
