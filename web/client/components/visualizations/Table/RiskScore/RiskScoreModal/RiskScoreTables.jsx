// @flow
import * as React from 'react';

import LoadingSpinner from 'components/ui/LoadingSpinner';
import Spacing from 'components/ui/Spacing';
import Tab from 'components/ui/Tabs/Tab';
import Table from 'components/ui/Table';
import Tabs from 'components/ui/Tabs';
import { RISK_SCORE_TEXT } from 'components/visualizations/Table/RiskScore/defaults';
import { uniqueId } from 'util/util';
import type { RiskScoreDataPoint } from 'services/RiskScoreTableService/types';

const TEXT = RISK_SCORE_TEXT.RiskScoreModal.RiskScoreTables;

const HEADERS = [
  { id: TEXT.internalTable.impactOnScore },
  { id: TEXT.internalTable.type },
  { id: TEXT.internalTable.factor },
  { id: TEXT.internalTable.value },
];

type Props = {
  data: $ReadOnlyArray<RiskScoreDataPoint> | void,
};

function RiskScoreTables({ data }: Props) {
  if (data === undefined) {
    return (
      <Spacing padding="m" flex justifyContent="center">
        <LoadingSpinner />
      </Spacing>
    );
  }

  const buildFactors = (
    sortedRows: $ReadOnlyArray<RiskScoreDataPoint>,
  ): $ReadOnlyArray<RiskScoreDataPoint> =>
    // Instead of using the term property's actual value, we want to represent the
    // relative term magnitudes by ranking all the factors
    sortedRows.map<RiskScoreDataPoint>(
      (dataPoint: RiskScoreDataPoint, index: number) => ({
        ...dataPoint,
        term: index + 1,
      }),
    );

  const renderRow = (row: RiskScoreDataPoint) => (
    <Table.Row id={uniqueId()}>
      <Table.Cell>{row.term}</Table.Cell>
      <Table.Cell>{row.type}</Table.Cell>
      <Table.Cell>{row.variable}</Table.Cell>
      <Table.Cell>{row.value}</Table.Cell>
    </Table.Row>
  );

  const renderFactorsTable = (rows: $ReadOnlyArray<RiskScoreDataPoint>) => (
    <Table
      className="risk-score-factors-section__table"
      adjustWidthsToContent
      headers={HEADERS}
      data={rows}
      renderRow={renderRow}
      isHoverable={false}
    />
  );

  return (
    <Tabs>
      <Tab name={TEXT.internalTabs.positiveHeader}>
        {renderFactorsTable(
          buildFactors(data.filter(dataPoint => dataPoint.type === 'Positive')),
        )}
      </Tab>
      <Tab name={TEXT.internalTabs.negativeHeader}>
        {renderFactorsTable(
          buildFactors(data.filter(dataPoint => dataPoint.type === 'Negative')),
        )}
      </Tab>
      <Tab name={TEXT.internalTabs.allHeader}>
        {renderFactorsTable(buildFactors(data))}
      </Tab>
    </Tabs>
  );
}

export default (React.memo(RiskScoreTables): React.AbstractComponent<Props>);
