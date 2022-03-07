// @flow
import * as React from 'react';
import classNames from 'classnames';

import Intents from 'components/ui/Intents';
import UnstyledButton from 'components/ui/Button/UnstyledButton';
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

  /** Optional button contents styling */
  buttonContentsStyle?: StyleObject,

  /** Optional additional class name to add to the button */
  className?: string,

  /** Optional additional class name to add to the button contents */
  contentsClassName?: string,

  /**
   * Disable the button. The `onClick` event will not fire if this is true
   */
  disabled?: boolean,

  /**
   * The intent should be specified through `Button.Intents`
   */
  intent?: 'primary' | 'success' | 'danger',

  /**
   * Change the style to only display the children of the button. If both outline
   * and minimal are set to true, minimal will override outline.
   */
  minimal?: boolean,

  /**
   * Gets called when the button is clicked.
   * @param {SyntheticEvent.button} event The click event
   */
  onClick?: (event: SyntheticMouseEvent<HTMLButtonElement>) => void,

  /** Change the style to only display the outline of the button */
  outline?: boolean,

  /** The size should be specified through `Button.Sizes` */
  size?: 'large' | 'medium' | 'small',
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

type SizesMap = {
  LARGE: 'large',
  MEDIUM: 'medium',
  SMALL: 'small',
};

const SIZES: SizesMap = {
  LARGE: 'large',
  MEDIUM: 'medium',
  SMALL: 'small',
};

/**
 * A basic button component used to click things.
 *
 * Button intents can be specified using the `Button.Intents` constant:
 *
 * `Button.Intents.PRIMARY | DANGER | SUCCESS`
 */
export default function Button({
  children,
  ariaName = undefined,
  buttonContentsStyle = undefined,
  className = '',
  contentsClassName = '',
  disabled = false,
  intent = Intents.PRIMARY,
  minimal = false,
  onClick = undefined,
  outline = false,
  size = SIZES.SMALL,
  style = undefined,
  testId = undefined,
}: Props): React.Element<'button'> {
  const [onButtonClick, ariaNameToUse] = useCommonButtonSetup(
    ariaName,
    children,
    disabled,
    onClick,
  );

  // minimal overrides outline in cases both are true.
  const fullClassName = classNames(
    `zen-button zen-button--${size}`,
    className,
    {
      [`zen-button--${intent}`]: !outline && !minimal && !disabled,
      [`zen-button--${intent}-outline`]: outline && !minimal && !disabled,
      [`zen-button--${intent}-minimal`]: minimal && !disabled,
      'zen-button--disabled': disabled,
    },
  );

  return (
    <button
      aria-label={normalizeARIAName(ariaNameToUse)}
      data-testid={testId}
      className={fullClassName}
      type="button"
      onClick={onButtonClick}
      style={style}
    >
      <div
        className={`zen-button__contents zen-button__contents--${size} ${contentsClassName}`}
        style={buttonContentsStyle}
      >
        {children}
      </div>
    </button>
  );
}

Button.Intents = Intents;
Button.Sizes = SIZES;
Button.Unstyled = UnstyledButton;
