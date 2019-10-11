import React from 'react';
import PropTypes from 'prop-types';

import QueryResultContainer from 'components/QueryApp/QueryResultContainer';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';

const propTypes = {
  onRemoveResult: PropTypes.func.isRequired,
  queryRequests: PropTypes.arrayOf(
    PropTypes.shape({
      selections: PropTypes.instanceOf(SimpleQuerySelections).isRequired,
      timestamp: PropTypes.number.isRequired,
    }),
  ).isRequired,
  scrollNewResultsIntoView: PropTypes.bool.isRequired,
};

export default function QueryResultsList({
  onRemoveResult,
  queryRequests,
  scrollNewResultsIntoView,
}) {
  const queryResultContainers = queryRequests.map(
    ({ selections, timestamp }) => (
      <QueryResultContainer
        key={timestamp}
        initialSelections={selections}
        timestamp={timestamp}
        onRemoveResult={onRemoveResult}
        viewType={selections.viewType}
        scrollIntoViewOnLoad={scrollNewResultsIntoView}
      />
    ),
  );

  return <div>{queryResultContainers}</div>;
}

QueryResultsList.propTypes = propTypes;
