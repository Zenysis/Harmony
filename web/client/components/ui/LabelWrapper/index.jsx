// @flow
import * as React from 'react';
import classNames from 'classnames';

type Props = {|
  children: React.Node,

  /** Sets font-weight to bold on the label */
  boldLabel: boolean,

  /** The label to render. This can be any React Node. */
  label: React.Node,

  /** The class name for the div wrapping the entire group (children + label) */
  className: string,

  /** The class name for the div wrapping the children */
  contentClassName: string,

  /**
   * The id of the DOM node associated with this label. If this prop is set,
   * then the component will render as a `<label>` instead of `<div>`.
   */
  htmlFor?: string,

  /** Whether or not to render the label and children content inline */
  inline: boolean,

  /** Whether or not to place the label _after_ the children */
  labelAfter: boolean,

  /** The class name for the div wrapping the label */
  labelClassName: string,
|};

/**
 * Wrapper component to easily add a label to any children it wraps.
 *
 * By default the label will appear above the wrapped children.
 */
export default class LabelWrapper extends React.PureComponent<Props> {
  static defaultProps = {
    boldLabel: false,
    className: '',
    contentClassName: '',
    htmlFor: undefined,
    inline: false,
    labelAfter: false,
    labelClassName: '',
  };

  render() {
    const {
      boldLabel,
      className,
      contentClassName,
      labelClassName,
      htmlFor,
      inline,
      labelAfter,
      label,
      children,
    } = this.props;

    const mainClassName = classNames('zen-label-wrapper', className);

    const lblClassName = classNames(
      'zen-label-wrapper__label',
      labelClassName,

      // choose additional classes to add depending on label's placement,
      // so that we can add the margin spacing at the correct location
      {
        'zen-label-wrapper__label--inline': inline,
        'zen-label-wrapper__label--inline-before': inline && !labelAfter,
        'zen-label-wrapper__label--inline-after': inline && labelAfter,
        'zen-label-wrapper__label--newline-before': !inline && !labelAfter,
        'zen-label-wrapper__label--newline-after': !inline && labelAfter,
        'zen-label-wrapper__label--bold': boldLabel,
      },
    );

    const childrenClassName = classNames(
      'zen-label-wrapper__wrapped-content',
      contentClassName,
      { 'zen-label-wrapper__wrapped-content--inline': inline },
    );

    const labelNode = htmlFor ? (
      <label className={lblClassName} htmlFor={htmlFor}>
        {label}
      </label>
    ) : (
      <div className={lblClassName}>{label}</div>
    );

    const childrenNode = <div className={childrenClassName}>{children}</div>;
    return (
      <div className={mainClassName}>
        {labelAfter ? childrenNode : labelNode}
        {labelAfter ? labelNode : childrenNode}
      </div>
    );
  }
}
