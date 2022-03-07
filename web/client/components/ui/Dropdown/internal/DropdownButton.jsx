// @flow
import * as React from 'react';
import classNames from 'classnames';

import Caret from 'components/ui/Caret';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import type { CaretType } from 'components/ui/Caret';
import type { StyleObject } from 'types/jsCore';

export type Intent =
  | 'default'
  | 'plain'
  | 'primary'
  | 'success'
  | 'danger'
  | 'info'
  | 'warning';

type DefaultProps = {
  ariaName?: string,
  dataContent?: string,
  valueStyle?: StyleObject,
};

type Props = {
  ...DefaultProps,
  buttonIntent: Intent,
  children: React.Node,
  className: string,
  disabled: boolean,
  hideCaret: boolean,
  caretType: CaretType,
  onButtonClick: (SyntheticEvent<HTMLButtonElement>) => void,
  showContentsOnHover: boolean,
  testId: string,
};

/**
 * This is the main button that opens the dropdown menu when you click on it.
 */
export default class DropdownButton extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    ariaName: undefined,
    dataContent: undefined,
    valueStyle: undefined,
  };

  maybeRenderCaret(): React.Element<typeof Caret> | null {
    return this.props.hideCaret ? null : (
      <Caret
        className="zen-dropdown-button__caret"
        type={this.props.caretType}
      />
    );
  }

  render(): React.Element<'div'> {
    const {
      ariaName,
      children,
      buttonIntent,
      className,
      dataContent,
      disabled,
      onButtonClick,
      valueStyle,
      showContentsOnHover,
      testId,
    } = this.props;

    const btnClassName = classNames(
      `zen-dropdown-button__main-btn ${className}`,
      `zen-dropdown-button__main-btn--${buttonIntent}`,
    );

    const hoverTitle =
      showContentsOnHover &&
      (typeof children === 'string' || typeof children === 'number')
        ? children
        : undefined;

    // We need to wrap the `<button>` element in a div because we can't use
    // `display: flex` on button elements, so we need to set flex on the div
    return (
      <div className="zen-dropdown-button">
        <button
          aria-label={normalizeARIAName(ariaName)}
          disabled={disabled}
          className={btnClassName}
          data-content={dataContent}
          onClick={onButtonClick}
          title={hoverTitle}
          type="button"
          data-testid={testId}
        >
          <div
            className="zen-dropdown-button__button-content"
            style={valueStyle}
          >
            {children}
          </div>
          {this.maybeRenderCaret()}
        </button>
      </div>
    );
  }
}
