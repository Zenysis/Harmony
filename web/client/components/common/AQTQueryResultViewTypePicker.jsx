// @flow
import React from 'react';
import classNames from 'classnames';

import Icon from 'components/ui/Icon';
import {
  RESULT_VIEW_ORDER,
  RESULT_VIEW_NAMES,
  RESULT_VIEW_TYPES,
} from 'components/QueryResult/viewTypes';
import { capitalize } from 'util/stringUtil';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

// TODO(nina): Make this dynamic to the screen size
const SHOW_IN_DROPDOWN = 3;

type Props = {
  onViewTypeChange: (viewType: ResultViewType) => void,
  viewType: ResultViewType,

  resultViewOrder: $ReadOnlyArray<ResultViewType>,
  useDropdown: boolean,
};

type State = {};

export default class AQTQueryResultViewTypePicker extends React.PureComponent<
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

  maybeRenderBeta(viewType: ResultViewType) {
    if (viewType !== RESULT_VIEW_TYPES.BAR_GRAPH) {
      return null;
    }
    return <sup style={{ color: 'red' }}> beta</sup>;
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
          {this.maybeRenderBeta(viewType)}
        </button>
      );
    });
    return <span>{buttons}</span>;
  }

  renderViewDropdown() {
    const currentViewType = this.props.viewType;
    const { resultViewOrder } = this.props;

    if (resultViewOrder.length <= SHOW_IN_DROPDOWN) {
      return this.renderViewButtons();
    }
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
        <ul className="aqt-result-controls-bottom__dropdown-list dropdown-menu dropdown-menu-right">
          <li>{dropdownButtonOptions}</li>
        </ul>
      </span>
    );

    return (
      <span>
        {buttons}
        {dropdownButton}
      </span>
    );
  }

  render() {
    return this.props.useDropdown
      ? this.renderViewDropdown()
      : this.renderViewButtons();
  }
}
