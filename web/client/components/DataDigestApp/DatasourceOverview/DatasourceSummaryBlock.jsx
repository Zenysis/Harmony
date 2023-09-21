// @flow
import * as React from 'react';

import Alert from 'components/ui/Alert';
import BigNumber from 'components/DataDigestApp/DatasourceOverview/BigNumber';
import DatasourceDigest from 'models/DataDigestApp/DatasourceDigest';
import Group from 'components/ui/Group';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import Spacing from 'components/ui/Spacing';
import useIndicatorDigestData from 'components/DataDigestApp/DatasourceOverview/useIndicatorDigestData';

type Props = {
  digest: DatasourceDigest | void,
};

const READABLE_DATE_FORMAT = 'MMMM D, YYYY';

export default function DatasourceSummaryBlock({ digest }: Props): React.Node {
  const [indicatorDigestData, isLoadingIndicatorData] = useIndicatorDigestData(
    digest,
  );

  if (isLoadingIndicatorData || !digest) {
    return <LoadingSpinner />;
  }

  const renderDatasourceDatesBlock = () => {
    if (indicatorDigestData) {
      const earliestDate = indicatorDigestData.getEarliestDate();
      const latestDate = indicatorDigestData.getLatestDate();

      if (earliestDate && latestDate) {
        return (
          <p>
            This datasource has data from{' '}
            <b>{earliestDate.format(READABLE_DATE_FORMAT)}</b> to{' '}
            <b>{latestDate.format(READABLE_DATE_FORMAT)}</b>.
          </p>
        );
      }

      return (
        <Alert
          intent="error"
          title={
            <p className="dd-no-datapoints-alert">
              Could not find any datapoints integrated for this datasource
            </p>
          }
        >
          <p>
            Either there is a bug in the Data Digest, or the datasource is
            actually empty.
          </p>
          <p>
            If you expected data, go to AQT and query an indicator from this
            datasource and check if it returns data. If it returns data, then
            this is a bug in Data Digest. If it returns no data, then this is a
            problem with the integration or datasource.
          </p>
        </Alert>
      );
    }

    return (
      <Alert
        intent="error"
        title={
          <p className="dd-no-datapoints-alert">
            No summary statistics are available
          </p>
        }
      >
        <p>
          We could not find summary statistics for this datasource&apos;s
          indicators. This means the pipeline has not been configured to report
          a data digest.
        </p>
      </Alert>
    );
  };

  const totalNumDatapoints = indicatorDigestData
    ? indicatorDigestData.getTotalNumberOfDataPoints().toLocaleString()
    : 'N/A';
  const numIndicators = indicatorDigestData
    ? indicatorDigestData.getNumberOfIndicators()
    : 'N/A';

  return (
    <>
      <Spacing marginTop="s">
        {renderDatasourceDatesBlock()}
        <Group.Horizontal flex justifyContent="center" spacing="xxl">
          <BigNumber
            subtitle="Datapoints integrated"
            value={totalNumDatapoints}
          />
          <BigNumber subtitle="Indicators" value={numIndicators} />
        </Group.Horizontal>
      </Spacing>
    </>
  );
}
