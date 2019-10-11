// @flow
import * as React from 'react';
import classNames from 'classnames';

import type { StyleObject } from 'types/jsCore';

export type CaretDirection =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'up'
  | 'down';

export type CaretType = 'triangle' | 'chevron' | 'menu';

export const DIRECTIONS: { [string]: CaretDirection } = {
  UP: 'top',
  DOWN: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
};

export const CARET_TYPES: { [string]: CaretType } = {
  TRIANGLE: 'triangle',
  CHEVRON: 'chevron',
  MENU: 'menu',
};

/**
 * Gets the new direction of the caret.
 *
 * Note(dennis): This is implemented like this to avoid breaking all parts in
 * the codebase where the Caret is used. The default caret will be rendered but
 * we now have an option of it being a chevron or a menu icon. I added two
 * options (up and down) to the direction because if the type is chevron the top
 *and bottom icons are named up and down instead.
 *
 * @param {string} caretType The type of the caret, can either be chevron,
 * triangle or menu as they are the options available in glyphicon docs
 * @param {string} caretDirection The direction of the caret.
 */
function getCaretDirection(
  caretType: CaretType,
  caretDirection: CaretDirection,
): string {
  let direction = caretDirection;
  if (caretType !== CARET_TYPES.TRIANGLE && direction === DIRECTIONS.UP) {
    direction = 'up';
  }

  if (
    caretType !== CARET_TYPES.TRIANGLE &&
    caretDirection === DIRECTIONS.DOWN
  ) {
    direction = 'down';
  }
  return direction;
}

type Props = {|
  className: string,
  direction: CaretDirection,
  isDisabled: boolean,
  type: CaretType,
  onClick?: (event: SyntheticEvent<HTMLDivElement>) => void,
  size?: number,
|};

const defaultProps = {
  className: '',
  direction: DIRECTIONS.DOWN,
  isDisabled: false,
  onClick: undefined,
  size: undefined,
  type: CARET_TYPES.TRIANGLE,
};

/**
 * A basic Caret component to point at a given direction.
 *
 * Directions should be specified using the `Caret.Directions` constant:
 *
 * `Caret.Directions.UP | DOWN | LEFT | RIGHT`
 */
export default function Caret(props: Props) {
  const { className, direction, isDisabled, onClick, size, type } = props;
  const style: StyleObject = {};
  if (size) {
    style.fontSize = size;
  }

  const caretClassName = classNames('zen-caret', className, {
    disabled: isDisabled,
  });

  const caretDirection = getCaretDirection(type, direction);

  const caret = (
    <span
      className={`zen-caret__icon glyphicon glyphicon-${type}-${caretDirection}`}
    />
  );

  const onCaretClick = isDisabled ? undefined : onClick;
  if (onCaretClick) {
    return (
      <div
        role="button"
        onClick={onCaretClick}
        className={caretClassName}
        style={style}
      >
        {caret}
      </div>
    );
  }

  return (
    <div className={caretClassName} style={style}>
      {caret}
    </div>
  );
}

Caret.Directions = DIRECTIONS;
Caret.Types = CARET_TYPES;
Caret.defaultProps = defaultProps;
