// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import AnalyticalSection from 'components/AdvancedQueryApp/QueryFormPanel/Insights/AnalyticalSection';
import DataQualityInsightSummary from 'models/AdvancedQueryApp/Insights/DataQualityInsight/DataQualityInsightSummary';
import DataQualitySection from 'components/AdvancedQueryApp/QueryFormPanel/Insights/DataQualitySection';
import FieldSelector from 'components/AdvancedQueryApp/QueryFormPanel/Insights/FieldSelector';
import Group from 'components/ui/Group';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import Spacing from 'components/ui/Spacing';
import { getOriginalId } from 'models/core/wip/Field';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

type Props = {
  analyticalInsights: void,
  dataQualityInsights: DataQualityInsightSummary | void,
  fieldIds: $ReadOnlyArray<string>,
  filters: Zen.Array<QueryFilterItem>,
  loadingAnalyticalInsights: boolean,
  loadingDataQualityInsights: boolean,
  onUpdateSelectedFieldId: string => void,
  queryResultSpec: QueryResultSpec,
  selectedFieldId: string,
};

export default function Insights({
  analyticalInsights,
  dataQualityInsights,
  fieldIds,
  filters,
  loadingAnalyticalInsights,
  loadingDataQualityInsights,
  onUpdateSelectedFieldId,
  queryResultSpec,
  selectedFieldId,
}: Props): React.Node {
  // Build a representative series settings based on the first visualization.
  const seriesSettings = React.useMemo(
    () => queryResultSpec.getSeriesSettings(queryResultSpec.viewTypes()[0]),
    [queryResultSpec],
  );

  return (
    <Group.Vertical spacing="m">
      <FieldSelector
        fieldIds={fieldIds}
        onUpdateSelectedFieldId={onUpdateSelectedFieldId}
        selectedFieldId={selectedFieldId}
        seriesSettings={seriesSettings}
      />
      {loadingAnalyticalInsights && (
        <Spacing flex justifyContent="center" marginTop="xxxl">
          <LoadingSpinner />
        </Spacing>
      )}
      {!loadingAnalyticalInsights && analyticalInsights !== undefined && (
        <AnalyticalSection
          analyticalInsights={analyticalInsights}
          fieldIds={fieldIds}
          queryResultSpec={queryResultSpec}
          selectedFieldId={selectedFieldId}
        />
      )}
      {loadingDataQualityInsights && (
        <Spacing flex justifyContent="center" marginTop="xxxl">
          <LoadingSpinner />
        </Spacing>
      )}
      {!loadingDataQualityInsights && dataQualityInsights !== undefined && (
        <DataQualitySection
          dataQualityInsights={dataQualityInsights}
          fieldId={getOriginalId(selectedFieldId)}
          filters={filters.arrayView()}
        />
      )}
    </Group.Vertical>
  );
}
