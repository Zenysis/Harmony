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
  labelClassName: string,
  onQueryResultSpecChange: QueryResultSpec => void,
  queryResultSpec: QueryResultSpec | void,
  showLabel: boolean,
  viewType: ResultViewType,

  isDisabled?: boolean,
};

export default function FilterButton({
  className,
  iconClassName,
  labelClassName,
  onQueryResultSpecChange,
  queryResultSpec,
  showLabel,
  viewType,
  isDisabled = false,
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
          queryResultSpec={queryResultSpec}
          seriesInfo={seriesInfo}
          onRequestClose={hideModal}
          show={isModalOpen}
          onQueryResultSpecChange={onQueryResultSpecChange}
        />
      );
    }
    return null;
  }

  return (
    <React.Fragment>
      <Button.Unstyled
        className={className}
        disabled={isDisabled}
        onClick={showModal}
        dataContent={t('GridDashboardApp.DashboardQueryItem.filter')}
      >
        <Icon type="filter" className={iconClassName} />
        {showLabel && (
          <span className={labelClassName}>{I18N.text('Filter Results')}</span>
        )}
      </Button.Unstyled>
      {maybeRenderFilterModal()}
    </React.Fragment>
  );
}
