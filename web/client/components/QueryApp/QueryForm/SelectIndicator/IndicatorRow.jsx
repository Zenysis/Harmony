// @flow
import * as React from 'react';

import autobind from 'decorators/autobind';

type Props = {
  fieldId: string,
  isSelected: boolean,
  label: string,
  onClick: string => void,
};

export default class IndicatorRow extends React.PureComponent<Props> {
  @autobind
  onClick() {
    const { fieldId, onClick } = this.props;
    onClick(fieldId);
  }

  maybeRenderCheckmark() {
    if (!this.props.isSelected) {
      return null;
    }

    return (
      <i
        className="glyphicon glyphicon-ok select-indicator-indicator-row__checkmark"
        aria-hidden="true"
      />
    );
  }

  render() {
    return (
      <div
        className="select-indicator-indicator-row"
        role="button"
        onClick={this.onClick}
        title={this.props.label}
      >
        <span className="select-indicator-indicator-row__label">
          {this.props.label}
        </span>
        {this.maybeRenderCheckmark()}
      </div>
    );
  }
}
