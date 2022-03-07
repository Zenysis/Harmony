// @flow
import * as React from 'react';
import invariant from 'invariant';

import RiskScoreModal from 'components/visualizations/Table/RiskScore/RiskScoreModal';
import Table from 'components/visualizations/Table';
import {
  RISK_SCORE_INDICATOR_ID,
  RISK_SCORE_GROUPING_DIMENSION,
} from 'components/visualizations/Table/RiskScore/defaults';
import { getOriginalId } from 'models/core/wip/Field';
import type { DataRow } from 'models/visualizations/Table/types';
import type { VisualizationProps } from 'components/visualizations/common/commonTypes';

type Props = VisualizationProps<'TABLE'>;

/**
 * The RiskScoreTable is a wrapper component for the AQT Table that allows
 * users to select a value on the table and open a modal describing information
 * about that value. This is specific to a particular indicator and grouping.
 */
export default function RiskScoreTable(props: Props): React.Node {
  const [rowData, setRowData] = React.useState<DataRow | void>(undefined);
  const [showModal, setShowModal] = React.useState<boolean>(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const riskScoreIndicatorId = (): string | void =>
    Object.keys(props.seriesSettings.seriesObjects()).find(
      (id: string) => getOriginalId(id) === RISK_SCORE_INDICATOR_ID,
    );

  const onRiskScoreRowClick = (data: DataRow) => {
    if (
      Object.keys(data).find(
        id => getOriginalId(id) === RISK_SCORE_INDICATOR_ID,
      ) === undefined
    ) {
      return;
    }
    setRowData(data);
    openModal();
  };

  const enableRiskScoreModal =
    riskScoreIndicatorId() &&
    props.queryResult.dimensions().includes(RISK_SCORE_GROUPING_DIMENSION);

  const buildScore = (): number | string => {
    const originalId = riskScoreIndicatorId();
    return rowData && originalId && rowData[originalId] !== null
      ? rowData[originalId]
      : '';
  };

  function maybeRenderModal() {
    if (!showModal || rowData === undefined) {
      return null;
    }

    const id = rowData[RISK_SCORE_GROUPING_DIMENSION];
    const score = buildScore();

    invariant(
      id !== null,
      'The id should never be null when rendering the RiskScoreModal',
    );

    return (
      <RiskScoreModal
        sexWorkerId={id}
        score={score}
        onRequestClose={closeModal}
      />
    );
  }

  if (!enableRiskScoreModal) {
    return <Table {...props} />;
  }

  return (
    <React.Fragment>
      <Table onRowClick={onRiskScoreRowClick} {...props} />
      {maybeRenderModal()}
    </React.Fragment>
  );
}
