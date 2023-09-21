// @flow
import * as React from 'react';
import classNames from 'classnames';

import Icon from 'components/ui/Icon';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import type { StyleObject } from 'types/jsCore';

export type CaretDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type CaretType = 'TRIANGLE' | 'CHEVRON' | 'MENU';

type CaretDirectionMap = {
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  UP: 'UP',
};

type CaretTypeMap = {
  CHEVRON: 'CHEVRON',
  MENU: 'MENU',
  TRIANGLE: 'TRIANGLE',
};

const CARET_TYPE_TO_ICON_MAP = {
  TRIANGLE: {
    UP: 'triangle-top',
    DOWN: 'triangle-bottom',
    LEFT: 'triangle-left',
    RIGHT: 'triangle-right',
  },
  CHEVRON: {
    UP: 'chevron-up',
    DOWN: 'chevron-down',
    LEFT: 'chevron-left',
    RIGHT: 'chevron-right',
  },
  MENU: {
    UP: 'menu-up',
    DOWN: 'menu-down',
    LEFT: 'menu-left',
    RIGHT: 'menu-right',
  },
};

const DIRECTIONS: CaretDirectionMap = {
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
};

const CARET_TYPES: CaretTypeMap = {
  TRIANGLE: 'TRIANGLE',
  CHEVRON: 'CHEVRON',
  MENU: 'MENU',
};

type Props = {
  /** The accessibility name for this caret. */
  ariaName?: string,
  className?: string,
  direction?: CaretDirection,
  isDisabled?: boolean,
  onClick?: (event: SyntheticEvent<HTMLDivElement>) => void,
  size?: number,
  type?: CaretType,
};

/**
 * **This component is deprecated.**
 * Use the `<Icon>` component instead with a type of 'svg-caret-down', 'svg-caret-up', 'svg-caret-left' or 'svg-caret-right'
 *
 * A basic Caret component to point at a given direction.
 *
 * Directions should be specified using the `Caret.Directions` constant:
 *
 * `Caret.Directions.UP | DOWN | LEFT | RIGHT`
 * @deprecated
 */
export default function Caret({
  ariaName = undefined,
  className = '',
  direction = DIRECTIONS.DOWN,
  isDisabled = false,
  onClick = undefined,
  size = undefined,
  type = CARET_TYPES.TRIANGLE,
}: Props): React.Element<'div'> {
  const style: StyleObject = {
    fontSize: size !== undefined ? size : undefined,
  };

  const caretClassName = classNames('zen-caret', className, {
    disabled: isDisabled,
  });

  const caretIconType = CARET_TYPE_TO_ICON_MAP[type][direction];
  const caret = <Icon className="zen-caret__icon" type={caretIconType} />;
  const ariaNameToUse = normalizeARIAName(ariaName);

  if (onClick) {
    return (
      <div
        aria-label={ariaNameToUse}
        className={caretClassName}
        onClick={onClick}
        role="button"
        style={style}
      >
        {caret}
      </div>
    );
  }

  return (
    <div
      aria-hidden={ariaNameToUse === undefined}
      aria-label={ariaNameToUse}
      className={caretClassName}
      style={style}
    >
      {caret}
    </div>
  );
}

Caret.Directions = DIRECTIONS;
Caret.Types = CARET_TYPES;
