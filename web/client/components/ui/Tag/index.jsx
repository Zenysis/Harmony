// @flow
import * as React from 'react';
import classNames from 'classnames';

import Icon from 'components/ui/Icon';
import autobind from 'decorators/autobind';
import type { IconType } from 'components/ui/Icon/types';
import type { StyleObject } from 'types/jsCore';

type Intent = 'primary' | 'danger' | 'success' | 'warning' | 'info';
type Size = 'large' | 'medium' | 'small';

type IntentsMap = {
  PRIMARY: 'primary',
  DANGER: 'danger',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
};

type SizesMap = {
  LARGE: 'large',
  MEDIUM: 'medium',
  SMALL: 'small',
};

const INTENTS: IntentsMap = {
  PRIMARY: 'primary',
  DANGER: 'danger',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
};

const SIZES: SizesMap = {
  LARGE: 'large',
  MEDIUM: 'medium',
  SMALL: 'small',
};

type Props<T> = {|
  children: React.Node,

  /**
   * The value that is returned when a tag is clicked or removed.
   * This can be of any type.
   */
  value: T,

  /** Sets the font-weight to bold */
  boldText: boolean,
  className: string,

  /**
   * If you want the tag to have a primary action that is triggered
   * by clicking on an icon in the tag, rather than clicking
   * on the tag itself.
   */
  hasPrimaryAction: boolean,

  /**
   * Intents are accessible through `Tag.Intents.PRIMARY | SUCCESS | ...`
   */
  intent: Intent,

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
  primaryActionIconType: IconType,

  /**
   * If you want the tag to have a removable icon, this needs to be set
   */
  removable: boolean,

  /** The size should be specified through `Tag.Sizes` */
  size: Size,

  /** Render this tag as a solid color instead of a gradient */
  solidColor: boolean,
  style?: StyleObject,

  /**
   * This gets added as a `zen-test-id` attribute on the tag. Use this only
   * when you need to locate a tag in a webdriver test. The xpath to locate
   * this tag would be:
   *
   * `//div[@zen-test-id="yourTestId"]`
   */
  testId?: string,
|};

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
export default class Tag<T> extends React.PureComponent<Props<T>> {
  static defaultProps = {
    boldText: false,
    className: '',
    hasPrimaryAction: false,
    intent: INTENTS.PRIMARY,
    onClick: undefined,
    onPrimaryAction: undefined,
    onRequestRemove: undefined,
    primaryActionIconType: 'chevron-down',
    removable: false,
    size: SIZES.LARGE,
    solidColor: false,
    style: undefined,
    testId: undefined,
  };

  static Intents = INTENTS;
  static Sizes = SIZES;

  /** This is the same as `<Tag>` with `value` set to `undefined` */
  static Simple = (
    props: $Diff<React.ElementConfig<Class<Tag<void>>>, { value: mixed }>,
  ) => <Tag value={undefined} {...props} />;

  @autobind
  onRequestRemove(event: SyntheticMouseEvent<HTMLSpanElement>) {
    if (this.props.onRequestRemove) {
      this.props.onRequestRemove(this.props.value, event);
    }
  }

  @autobind
  onClick(event: SyntheticMouseEvent<HTMLDivElement>) {
    if (this.props.onClick) {
      this.props.onClick(this.props.value, event);
    }
  }

  @autobind
  onClickPrimaryAction(event: SyntheticMouseEvent<HTMLSpanElement>) {
    const { onPrimaryAction } = this.props;
    if (onPrimaryAction) {
      // Stop bubbling the event so that when the primaryAction icon is clicked
      // the Tag's main onClick event does not also trigger
      event.stopPropagation();
      onPrimaryAction(this.props.value, event);
    }
  }

  maybeRenderRemoveButton() {
    if (this.props.removable) {
      return (
        <Icon
          type="remove"
          className="zen-tag__remove-btn"
          onClick={this.onRequestRemove}
        />
      );
    }

    return null;
  }

  maybeRenderPrimaryActionButton() {
    const { hasPrimaryAction, primaryActionIconType } = this.props;
    if (hasPrimaryAction) {
      return (
        <Icon
          type={primaryActionIconType}
          className="zen-tag__primary-action-btn"
          onClick={this.onClickPrimaryAction}
        />
      );
    }

    return null;
  }

  renderContent() {
    return <div className="zen-tag__content">{this.props.children}</div>;
  }

  render() {
    const {
      boldText,
      onClick,
      style,
      className,
      removable,
      intent,
      solidColor,
      hasPrimaryAction,
      size,
      testId,
    } = this.props;
    const divClassName = classNames(`zen-tag zen-tag--${size}`, className, {
      [`zen-tag--${intent}-gradient`]: !solidColor,
      [`zen-tag--${intent}-solid`]: solidColor,
      'zen-tag--bold': boldText,
      'zen-tag--clickable': !!onClick,
      'zen-tag--has-icons': removable || hasPrimaryAction,
    });

    const extraProps = {};
    if (onClick) {
      extraProps.onClick = this.onClick;
      extraProps.role = 'button';
    }

    return (
      <div
        zen-test-id={testId}
        className={divClassName}
        style={style}
        {...extraProps}
      >
        <div className="zen-tag__content-container">
          {this.renderContent()}
          {this.maybeRenderPrimaryActionButton()}
          {this.maybeRenderRemoveButton()}
        </div>
      </div>
    );
  }
}
