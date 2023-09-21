// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import FilterModal from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterModal';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import useBoolean from 'lib/hooks/useBoolean';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type Props = {
  className: string,
  iconClassName: string,
  isDisabled?: boolean,
  labelClassName: string,
  onQueryResultSpecChange: QueryResultSpec => void,
  queryResultSpec: QueryResultSpec | void,
  showLabel: boolean,
  viewType: ResultViewType,
};

export default function FilterButton({
  className,
  iconClassName,
  isDisabled = false,
  labelClassName,
  onQueryResultSpecChange,
  queryResultSpec,
  showLabel,
  viewType,
}: Props): React.Node {
  const [isModalOpen, showModal, hideModal] = useBoolean(false);

  function maybeRenderFilterModal() {
    if (queryResultSpec) {
      const { seriesObjects, seriesOrder } = queryResultSpec
        .getSeriesSettings(viewType)
        .modelValues();
      const seriesInfo = seriesOrder.map(seriesId => ({
        fieldId: seriesId,
        seriesLabel: seriesObjects[seriesId].label(),
      }));

      return (
        <FilterModal
          onQueryResultSpecChange={onQueryResultSpecChange}
          onRequestClose={hideModal}
          queryResultSpec={queryResultSpec}
          seriesInfo={seriesInfo}
          show={isModalOpen}
        />
      );
    }
    return null;
  }

  return (
    <React.Fragment>
      <Button.Unstyled
        className={className}
        dataContent={I18N.text('Filter Data')}
        disabled={isDisabled}
        onClick={showModal}
      >
        <Icon className={iconClassName} type="filter" />
        {showLabel && (
          <span className={labelClassName}>{I18N.text('Filter Results')}</span>
        )}
      </Button.Unstyled>
      {maybeRenderFilterModal()}
    </React.Fragment>
  );
}
