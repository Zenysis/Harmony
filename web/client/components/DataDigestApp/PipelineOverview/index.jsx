// @flow
import * as React from 'react';

import Alert from 'components/ui/Alert';
import DataDigestService from 'services/DataDigestService';
import DatasourceDropdown from 'components/DataDigestApp/DatasourceDropdown';
import DatasourceNamesExplainer from 'components/DataDigestApp/DatasourceNamesExplainer';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import PipelineSummariesTable from 'components/DataDigestApp/PipelineOverview/PipelineSummariesTable';
import ProgressBar from 'components/ui/ProgressBar';
import SummaryInfoBlock from 'components/DataDigestApp/PipelineOverview/SummaryInfoBlock';
import { GLOBAL_PIPELINE_SUMMARY_KEY } from 'models/DataDigestApp/types';
import type PipelineDigest from 'models/DataDigestApp/PipelineDigest';
import type { DatasourceId } from 'models/DataDigestApp/types';

export default function PipelineOverview(): React.Node {
  const [
    pipelineDigest,
    setPipelineDigest,
  ] = React.useState<PipelineDigest | void>(undefined);
  const [lookbackWeeks, setLookbackWeeks] = React.useState(1);
  const [isLoadingDigest, setIsLoadingDigest] = React.useState(true);
  const [
    selectedSource,
    setSelectedSource,
  ] = React.useState<DatasourceId | void>(GLOBAL_PIPELINE_SUMMARY_KEY);

  React.useEffect(() => {
    setIsLoadingDigest(true);
    DataDigestService.getPipelineDigest(lookbackWeeks).then(
      newPipelineDigest => {
        setPipelineDigest(newPipelineDigest);
        setIsLoadingDigest(false);
      },
    );
  }, [lookbackWeeks]);

  function maybeRenderPipelineInfo() {
    if (pipelineDigest) {
      if (pipelineDigest.isEmpty()) {
        return (
          <Alert
            intent="error"
            title={
              <p>
                <b>No data found</b>
              </p>
            }
          >
            <p>
              No successful pipeline runs could be found{' '}
              {lookbackWeeks === 1
                ? 'in the last week'
                : `in the last ${lookbackWeeks} weeks`}
            </p>
          </Alert>
        );
      }

      if (selectedSource && !pipelineDigest.isEmpty()) {
        const summaries =
          pipelineDigest.getPipelineSummaries(selectedSource) || [];
        return (
          <Group.Vertical spacing="l">
            <SummaryInfoBlock
              pipelineDigest={pipelineDigest}
              pipelineHistory={summaries}
            />
            <PipelineSummariesTable summaries={summaries} />
          </Group.Vertical>
        );
      }
    }
    return null;
  }

  if (!pipelineDigest) {
    return <ProgressBar />;
  }

  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <Group.Vertical spacing="m">
        <Group.Horizontal>
          <p>Show successful pipeline runs from the last</p>
          <InputText
            onChange={v => setLookbackWeeks(Number(v))}
            step="1"
            type="number"
            value={String(lookbackWeeks)}
            width={70}
          />
          <p>
            {I18N.text(
              { one: 'week for', other: 'weeks for', zero: 'weeks for' },
              'lookback-weeks',
              { count: lookbackWeeks },
            )}
          </p>
          <DatasourceDropdown
            datasources={pipelineDigest.getDatasourceNames()}
            includeAllOption
            onSelectionChange={setSelectedSource}
            value={selectedSource}
          />
          <DatasourceNamesExplainer />
        </Group.Horizontal>
        {isLoadingDigest ? <LoadingSpinner /> : maybeRenderPipelineInfo()}
      </Group.Vertical>
    </React.Suspense>
  );
}
