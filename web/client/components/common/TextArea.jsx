// @flow
import * as React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import classNames from 'classnames';

import autobind from 'decorators/autobind';
import type { StyleObject } from 'types/jsCore';

type DefaultProps = {
  className: string | void,
  maxHeight: string | number | void,
  maxRows: number | void,
  minHeight: string | number | void,
  placeholder?: string,
  rows: number,
  style: StyleObject | void,
};

type Props = {
  ...DefaultProps,
  onChange: (value: string) => void,
  value: string,
};

export default class TextArea extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    className: undefined,
    maxHeight: undefined,
    maxRows: undefined,
    minHeight: undefined,
    placeholder: '',
    rows: 1,
    style: undefined,
  };

  getStyle(): StyleObject {
    const { maxHeight, minHeight, style } = this.props;
    const oldMinHeight = style ? style.minHeight : undefined;
    const oldMaxHeight = style ? style.maxHeight : undefined;
    const styleObject = {
      ...style,
      maxHeight: maxHeight !== undefined ? maxHeight : oldMaxHeight,
      minHeight: minHeight !== undefined ? minHeight : oldMinHeight,
    };

    return styleObject;
  }

  @autobind
  onChange(event: Event) {
    const { target } = event;

    if (target instanceof HTMLTextAreaElement) {
      this.props.onChange(target.value);
    }
  }

  render(): React.Node {
    const { maxRows, placeholder, rows, value } = this.props;
    const className = classNames(
      'zen-textarea form-control',
      this.props.className,
    );

    return (
      <TextareaAutosize
        className={className}
        maxRows={maxRows}
        onChange={this.onChange}
        placeholder={placeholder}
        rows={rows}
        style={this.getStyle()}
        value={value}
      />
    );
  }
}
