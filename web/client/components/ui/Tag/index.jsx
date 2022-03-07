// @flow
import * as React from 'react';
import classNames from 'classnames';

import Icon from 'components/ui/Icon';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import type { IconType } from 'components/ui/Icon/types';
import type { StyleObject } from 'types/jsCore';

const TEXT = t('ui.Tag');

const INTENTS = Object.freeze({
  PRIMARY: 'primary',
  DANGER: 'danger',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
});

const SIZES = Object.freeze({
  LARGE: 'large',
  MEDIUM: 'medium',
  SMALL: 'small',
});

type Intent = $Values<typeof INTENTS>;
export type TagSize = $Values<typeof SIZES>;

type Props<T> = {
  children: React.Node,

  /**
   * The value that is returned when a tag is clicked or removed.
   * This can be of any type.
   */
  value: T,

  /**
   * The accessibility name for this tag. If none is specified, we will
   * use the tag contents if it is a string.
   */
  ariaName?: string,

  /** Sets the font-weight to bold */
  boldText?: boolean,
  className?: string,

  /**
   * If you want the tag to have a primary action that is triggered
   * by clicking on an icon in the tag, rather than clicking
   * on the tag itself.
   */
  hasPrimaryAction?: boolean,

  /** The DOM ID of this node */
  id?: string,

  /**
   * Intents are accessible through `Tag.Intents.PRIMARY | SUCCESS | ...`
   */
  intent?: Intent,

  /**
   * Gets called when the tag is clicked.
   * @param {T} value The value passed to the `value` prop
   * @param {SyntheticMouseEvent.div} event The click event
   */
  onClick?: (value: T, event: SyntheticMouseEvent<HTMLDivElement>) => void,

  /**
   * The event handler for when the primary action icon is clicked
   * */
  onPrimaryAction?: (
    value: T,
    event: SyntheticMouseEvent<HTMLSpanElement>,
  ) => void,

  /**
   * Gets called when the remove icon on the tag is clicked.
   * The tag must be set as `removable` for this event to be triggered.
   * **NOTE:** this is a controlled component, meaning this event just
   * **requests** the removal of the tag. It's up to the parent to
   * still remove it.
   * @param {T} value The value passed to the `value` prop
   * @param {SyntheticEvent.div} event The click event
   */
  onRequestRemove?: (
    value: T,
    event: SyntheticMouseEvent<HTMLSpanElement>,
  ) => void,

  /**
   * The icon class name for the primary action.
   * This must be a glyphicon class.
   */
  primaryActionIconType?: IconType,

  /**
   * If you want the tag to have a removable icon, this needs to be set
   */
  removable?: boolean,

  /** The size should be specified through `Tag.Sizes` */
  size?: TagSize,

  /** Render this tag as a solid color instead of a gradient */
  solidColor?: boolean,
  style?: StyleObject,

  /**
   * This gets added as a `data-testid` attribute on the tag. Use this only
   * when you need to locate a tag in a webdriver test. The xpath to locate
   * this tag would be:
   *
   * `//div[@data-testid="yourTestId"]`
   */
  testId?: string,
};

/**
 * A UI component to represent a tag, which can either be clickable,
 * or just for display purposes.
 *
 * If you do not need your tag to be associated with a value then use
 * `<Tag.Simple>` which will default `value` to `undefined`. The following
 * two are equivalent:
 *
 * `<Tag.Simple>` and `<Tag value={undefined}>`
 */
export default function Tag<T>({
  children,
  value,
  ariaName = undefined,
  boldText = false,
  className = '',
  hasPrimaryAction = false,
  id = undefined,
  intent = INTENTS.PRIMARY,
  onClick = undefined,
  onPrimaryAction = undefined,
  onRequestRemove = undefined,
  primaryActionIconType = 'chevron-down',
  removable = false,
  size = SIZES.LARGE,
  solidColor = false,
  style = undefined,
  testId = undefined,
}: Props<T>): React.Element<'div'> {
  const removeIconRef = React.useRef<?HTMLSpanElement>();

  const onRemoveIconClick = (event: SyntheticMouseEvent<HTMLSpanElement>) => {
    if (onRequestRemove) {
      onRequestRemove(value, event);
    }
  };

  const onTagClick = (event: SyntheticMouseEvent<HTMLDivElement>) => {
    if (onClick) {
      // if we clicked on the _removeIcon, then ignore the tag click event
      if (
        removeIconRef.current &&
        event.target instanceof Node &&
        (event.target === removeIconRef.current ||
          removeIconRef.current.contains(event.target))
      ) {
        return;
      }
      onClick(value, event);
    }
  };

  const onClickPrimaryAction = (
    event: SyntheticMouseEvent<HTMLSpanElement>,
  ) => {
    if (onPrimaryAction) {
      // Stop bubbling the event so that when the primaryAction icon is clicked
      // the Tag's main onClick event does not also trigger
      // TODO(pablo): this is not a safe way to avoid the main onClick event
      // because it disrupts the bubbling of the event that might break other
      // places where we still need the event to propagate. A better approach
      // is checking the onClick event to see if we clicked the icon, like
      // what we do for the removeIconElt
      event.stopPropagation();
      onPrimaryAction(value, event);
    }
  };

  const removeButton = removable && (
    <span
      role="button"
      className="zen-tag__remove-btn-wrapper"
      ref={removeIconRef}
      aria-label={normalizeARIAName(TEXT.remove)}
      onClick={onRemoveIconClick}
    >
      <Icon ariaHidden type="svg-close" className="zen-tag__remove-btn" />
    </span>
  );

  const primaryActionButton = hasPrimaryAction && (
    <Icon
      type={primaryActionIconType}
      className="zen-tag__primary-action-btn"
      onClick={onClickPrimaryAction}
    />
  );

  const renderContent = <div className="zen-tag__content">{children}</div>;

  const divClassName = classNames(`zen-tag zen-tag--${size}`, className, {
    [`zen-tag--${intent}-gradient`]: !solidColor,
    [`zen-tag--${intent}-solid`]: solidColor,
    'zen-tag--bold': boldText,
    'zen-tag--clickable': !!onClick,
    'zen-tag--has-icons': removable || hasPrimaryAction,
  });

  const extraProps = {};
  if (onClick) {
    extraProps.onClick = onTagClick;
    extraProps.role = 'button';
  }

  // if no ARIA Name was specified, use the tag contents if it's a string
  const ariaNameToUse =
    ariaName || (typeof children === 'string' ? children : undefined);
  return (
    <div
      aria-label={normalizeARIAName(ariaNameToUse)}
      data-testid={testId}
      id={id}
      className={divClassName}
      style={style}
      {...extraProps}
    >
      <div className="zen-tag__content-container">
        {renderContent}
        {primaryActionButton}
        {removeButton}
      </div>
    </div>
  );
}

Tag.Intents = INTENTS;
Tag.Sizes = SIZES;

/** This is the same as `<Tag>` with `value` set to `undefined` */
Tag.Simple = (
  props: $Diff<React.ElementConfig<typeof Tag>, { value: mixed }>,
): React.Element<typeof Tag> => <Tag value={undefined} {...props} />;
