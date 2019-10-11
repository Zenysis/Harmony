// @flow
import React from 'react';

import QueryResult from 'components/QueryResult';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QueryResultViewTypePicker from 'components/common/QueryResultViewTypePicker';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import Tag from 'components/ui/Tag';
import autobind from 'decorators/autobind';
import {
  RESULT_VIEW_ORDER,
  RESULT_VIEW_TYPES,
} from 'components/QueryResult/common';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { smoothScrollIntoView } from 'util/util';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type Props = {
  initialSelections: SimpleQuerySelections,
  onRemoveResult: number => void,
  scrollIntoViewOnLoad: boolean,
  timestamp: number,

  hideTopControls: boolean,

  // eslint-disable-next-line react/no-unused-prop-types
  initialViewType: ResultViewType, // used in createInitialState
};

type State = {
  hasError: boolean,
  prevQueryResultSpec: QueryResultSpec,
  queryResultSpec: QueryResultSpec,
  unrecoverableError: boolean,
  useDropdown: boolean,
  viewType: ResultViewType,
};

export const DEFAULT_VIEW_TYPE = RESULT_VIEW_TYPES.CHART;

const TEXT = t('QueryApp.QueryResultContainer');

function notifyRecoverableError() {
  VENDOR_SCRIPTS.toastr.load().then(() => {
    window.toastr.error(TEXT.unknownError);
  });
}

function createInitialState(props: Props): State {
  const queryResultSpec = QueryResultSpec.fromSimpleQuerySelections(
    RESULT_VIEW_ORDER,
    props.initialSelections,
  );
  return {
    hasError: false,
    prevQueryResultSpec: queryResultSpec,
    queryResultSpec,
    viewType: props.initialViewType,
    unrecoverableError: false,
    useDropdown: $(window).width() < 1220,
  };
}

export default class QueryResultContainer extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps = {
    hideTopControls: false,
    initialViewType: DEFAULT_VIEW_TYPE,
  };

  static getDerivedStateFromProps(props: Props, state: State): $Shape<State> {
    const {
      hasError,
      prevQueryResultSpec,
      queryResultSpec,
      unrecoverableError,
    } = state;

    // If we have already detected this is an unrecoverable error, prevent
    // further changes to state.
    if (unrecoverableError) {
      return { unrecoverableError: true };
    }

    // If `hasError` is true, an exception was just triggered in a child
    // component.
    if (hasError) {
      // If the error was caused by a change in queryResultSpec, see if we can
      // revert to the previous spec and recover.
      if (prevQueryResultSpec !== queryResultSpec) {
        notifyRecoverableError();
        return {
          hasError: false,
          prevQueryResultSpec,
          queryResultSpec: prevQueryResultSpec,
        };
      }

      // If the specs are the same, we can't recover and should mark this as
      // an unrecoverable error.
      return { unrecoverableError: true };
    }

    return state;
  }

  // Handle errors that have occurred. QueryResultContainer's error boundary is
  // the last chance to prevent a full page crash and recover.
  static getDerivedStateFromError(): $Shape<State> {
    return { hasError: true };
  }

  state = createInitialState(this.props);
  _ref: $RefObject<'div'> = React.createRef();

  componentDidMount() {
    const { current } = this._ref;
    if (this.props.scrollIntoViewOnLoad && current) {
      smoothScrollIntoView(current);
    }
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  @autobind
  handleResize() {
    this.setState({
      useDropdown: $(window).width() < 1220,
    });
  }

  @autobind
  onRemoveResult() {
    this.props.onRemoveResult(this.props.timestamp);
  }

  @autobind
  onViewTypeChange(viewType: ResultViewType) {
    this.setState({ viewType });
    analytics.track('Change result view', { viewType });
  }

  @autobind
  onQueryResultSpecChange(newSpec: QueryResultSpec) {
    // Track the current and previous QueryResultSpec's so we can recover from
    // errors thrown by child components due to changes in the spec (like when
    // controls are changed but trigger an exception).
    this.setState(({ queryResultSpec }) => ({
      queryResultSpec: newSpec,
      prevQueryResultSpec: queryResultSpec,
    }));
  }

  maybeRenderTopControls() {
    if (this.props.hideTopControls) {
      return null;
    }
    const smallModeClass = this.state.useDropdown ? 'remove-button' : '';

    return (
      <div className="result-controls">
        <div className="result-controls-left">
          <div className="result-controls-bottom">
            <button
              type="button"
              className={`action-button ${smallModeClass}`}
              onClick={this.onRemoveResult}
              title={t('query_app.remove_query')}
            >
              <i className="glyphicon glyphicon-graph-remove" />
            </button>
          </div>
        </div>
        {this.maybeRenderViewTypeControls()}
      </div>
    );
  }

  maybeRenderViewTypeControls() {
    const { unrecoverableError, useDropdown, viewType } = this.state;
    if (unrecoverableError) {
      return null;
    }

    return (
      <div className="result-controls-right">
        <div className="result-controls-top">
          <QueryResultViewTypePicker
            useDropdown={useDropdown}
            viewType={viewType}
            onViewTypeChange={this.onViewTypeChange}
          />
        </div>
      </div>
    );
  }

  renderErrorMessage() {
    return (
      <div className="query-result-error">
        <Tag.Simple intent={Tag.Intents.DANGER}>
          {TEXT.unrecoverableError}
        </Tag.Simple>
      </div>
    );
  }

  renderQueryResult() {
    const { queryResultSpec, unrecoverableError, viewType } = this.state;
    if (unrecoverableError) {
      return this.renderErrorMessage();
    }

    return (
      <div className="result-container">
        <QueryResult
          queryResultSpec={queryResultSpec}
          querySelections={this.props.initialSelections}
          onQueryResultSpecChange={this.onQueryResultSpecChange}
          viewType={viewType}
          mode={QueryResult.Modes.QUERY_APP_VIEW}
        />
      </div>
    );
  }

  render() {
    const { unrecoverableError } = this.state;
    const errorClass = unrecoverableError
      ? 'query-result--unrecoverable-error'
      : '';

    const className = 'row query-result';

    return (
      <div className={`${className} ${errorClass}`} ref={this._ref}>
        {this.maybeRenderTopControls()}
        {this.renderQueryResult()}
      </div>
    );
  }
}
