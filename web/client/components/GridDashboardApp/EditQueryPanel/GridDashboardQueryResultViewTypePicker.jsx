// @flow
import React from 'react';
import classNames from 'classnames';

import Icon from 'components/ui/Icon';
import {
  RESULT_VIEW_ORDER,
  RESULT_VIEW_NAMES,
} from 'components/QueryResult/viewTypes';
import { capitalize } from 'util/stringUtil';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

// TODO(nina): Make this dynamic to the screen size
const SHOW_IN_DROPDOWN = 3;

type Props = {
  onViewTypeChange: (viewType: ResultViewType) => void,
  viewType: ResultViewType,

  resultViewOrder: $ReadOnlyArray<ResultViewType>,
};

type State = {};

export default class GridDashboardQueryResultViewTypePicker extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps = {
    resultViewOrder: RESULT_VIEW_ORDER,
  };

  onViewTypeChange(viewType: ResultViewType) {
    this.props.onViewTypeChange(viewType);
  }

  renderViewDropdown() {
    const currentViewType = this.props.viewType;
    const { resultViewOrder } = this.props;

    const showInDropdown = resultViewOrder.slice(0, SHOW_IN_DROPDOWN);
    const hideInDropdown = resultViewOrder.slice(SHOW_IN_DROPDOWN);

    const buttons = showInDropdown.map(viewType => {
      const classes = classNames('view-btn', {
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

    const dropdownButtonOptions = hideInDropdown.map(viewType => (
      <button
        className="view-dropdown-custom ui-button-primary"
        key={viewType}
        onClick={this.onViewTypeChange.bind(this, viewType)}
        type="button"
      >
        {capitalize(RESULT_VIEW_NAMES[viewType])}
      </button>
    ));

    const dropdownButton = (
      <span>
        <button
          className="aqt-view-btn-dropdown"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
          type="button"
        >
          <Icon type="option-horizontal" />
        </button>
        <ul className="dropdown-menu dropdown-menu-right">
          <li>{dropdownButtonOptions}</li>
        </ul>
      </span>
    );

    return (
      <div className="sidebar-view-type-picker">
        {buttons}
        {dropdownButton}
      </div>
    );
  }

  render() {
    return this.renderViewDropdown();
  }
}
