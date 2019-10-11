import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import update from 'immutability-helper';

import QueryForm from 'components/QueryApp/QueryForm';
import QueryResultsList from 'components/QueryApp/QueryResultsList';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';

const propTypes = {
  hideQueryForm: PropTypes.bool.isRequired,
  scrollNewResultsIntoView: PropTypes.bool.isRequired,

  initialQueryRequests: PropTypes.arrayOf(
    PropTypes.shape({
      selections: PropTypes.instanceOf(SimpleQuerySelections).isRequired,
      timestamp: PropTypes.number.isRequired,
    }),
  ),
};

const defaultProps = {
  hideQueryForm: false,
  scrollNewResultsIntoView: false,

  initialQueryRequests: [],
};

export default class QueryApp extends Component {
  static renderToDOM(queryAppProps = {}, elementId = 'app') {
    ReactDOM.render(
      <QueryApp {...queryAppProps} />,
      document.getElementById(elementId),
    );
  }

  constructor(props) {
    super(props);
    this.state = {
      queryRequests: props.initialQueryRequests || [],
    };

    this.onRunQuery = this.onRunQuery.bind(this);
    this.onRemoveResult = this.onRemoveResult.bind(this);
  }

  onRunQuery(selections) {
    // Add a new query result.
    this.setState(
      update(this.state, {
        queryRequests: {
          $unshift: [
            {
              selections,
              // Timestamp is being used as the ID for onRemoveResult
              timestamp: +new Date(),
            },
          ],
        },
      }),
    );
  }

  onRemoveResult(resultId) {
    this.setState(prevState => {
      const idx = prevState.queryRequests.findIndex(
        req => req.timestamp === resultId,
      );
      return update(prevState, {
        queryRequests: { $splice: [[idx, 1]] },
      });
    });
  }

  maybeRenderQueryForm() {
    if (this.props.hideQueryForm) {
      return null;
    }

    return (
      <QueryForm
        onRunQuery={this.onRunQuery}
      />
    );
  }

  render() {
    return (
      <div className="query-app min-full-page-height">
        {this.maybeRenderQueryForm()}
        <QueryResultsList
          scrollNewResultsIntoView={this.props.scrollNewResultsIntoView}
          queryRequests={this.state.queryRequests}
          onRemoveResult={this.onRemoveResult}
        />
      </div>
    );
  }
}

QueryApp.propTypes = propTypes;
QueryApp.defaultProps = defaultProps;
