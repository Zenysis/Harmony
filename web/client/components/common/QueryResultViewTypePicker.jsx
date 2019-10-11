// @flow
import React from 'react';
import classNames from 'classnames';

import {
  RESULT_VIEW_ORDER,
  RESULT_VIEW_NAMES,
} from 'components/QueryResult/viewTypes';
import { capitalize } from 'util/stringUtil';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type Props = {
  onViewTypeChange: (viewType: ResultViewType) => void,
  viewType: ResultViewType,

  resultViewOrder: $ReadOnlyArray<ResultViewType>,
  useDropdown: boolean,
};

type State = {};

export default class QueryResultViewTypePicker extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps = {
    resultViewOrder: RESULT_VIEW_ORDER,
    useDropdown: true,
  };

  onViewTypeChange(viewType: ResultViewType) {
    this.props.onViewTypeChange(viewType);
  }

  renderViewButtons() {
    const currentViewType = this.props.viewType;
    const { resultViewOrder } = this.props;
    const buttons = resultViewOrder.map(viewType => {
      const classes = classNames({
        'view-btn': true,
        'view-btn-active': viewType === currentViewType,
        'view-btn-inactive': viewType !== currentViewType,
      });

      return (
        <button
          className={classes}
          key={viewType}
          onClick={this.props.onViewTypeChange.bind(this, viewType)}
          type="button"
        >
          {capitalize(RESULT_VIEW_NAMES[viewType])}
        </button>
      );
    });
    return <span>{buttons}</span>;
  }

  renderViewDropdown() {
    const { resultViewOrder } = this.props;
    const buttons = resultViewOrder.map(viewType => (
      <button
        className="view-dropdown-custom ui-button-primary"
        key={viewType}
        onClick={this.onViewTypeChange.bind(this, viewType)}
        type="button"
      >
        {capitalize(RESULT_VIEW_NAMES[viewType])}
      </button>
    ));
    return (
      <span>
        <button
          className="btn view-btn btn-default dropdown-toggle"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
          type="button"
        >
          <i className="glyphicon glyphicon-stats" />
          {capitalize(RESULT_VIEW_NAMES[this.props.viewType])}
          <span className="caret" />
        </button>
        <ul className="dropdown-menu dropdown-menu-left">
          <li>{buttons}</li>
        </ul>
      </span>
    );
  }

  render() {
    return this.props.useDropdown
      ? this.renderViewDropdown()
      : this.renderViewButtons();
  }
}
