// @flow
import * as React from 'react';
import type Promise from 'bluebird';

import BaseModal from 'components/ui/BaseModal';
import Group from 'components/ui/Group';
import RiskScoreOverviewSection from 'components/visualizations/Table/RiskScore/RiskScoreModal/RiskScoreOverviewSection';
import RiskScoreTableService from 'services/RiskScoreTableService';
import RiskScoreTables from 'components/visualizations/Table/RiskScore/RiskScoreModal/RiskScoreTables';
import { OVERVIEW_DOC_LINK } from 'components/visualizations/Table/RiskScore/RiskScoreModal/defaults';
import { RISK_SCORE_TEXT } from 'components/visualizations/Table/RiskScore/defaults';
import { cancelPromise } from 'util/promiseUtil';
import type { RiskScoreDataPoint } from 'services/RiskScoreTableService/types';

const TEXT = RISK_SCORE_TEXT.RiskScoreModal;

type DefaultProps = {
  getRiskScoreInfo: typeof RiskScoreTableService.getRiskScoreInfo,
};

type Props = {
  ...DefaultProps,
  sexWorkerId: string | number,
  score: string | number,
  onRequestClose: () => void,
};

type State = {
  sortedRiskScoreInfo: $ReadOnlyArray<RiskScoreDataPoint> | void,
};

export default class RiskScoreModal extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    getRiskScoreInfo: RiskScoreTableService.getRiskScoreInfo,
  };

  state: State = {
    sortedRiskScoreInfo: undefined,
  };

  _riskScoreInfoPromise: Promise<void> | void = undefined;

  componentDidMount() {
    const { getRiskScoreInfo, sexWorkerId } = this.props;
    this._riskScoreInfoPromise = getRiskScoreInfo(sexWorkerId.toString()).then(
      riskScoreInfo => {
        const data = [...riskScoreInfo];
        this.setState({
          sortedRiskScoreInfo: data.sort((a, b) => b.term - a.term),
        });
      },
    );
  }

  componentWillUnmount() {
    if (this._riskScoreInfoPromise !== undefined) {
      cancelPromise(this._riskScoreInfoPromise);
    }
  }

  render(): React.Node {
    const { sexWorkerId, onRequestClose, score } = this.props;

    return (
      <BaseModal
        show
        onRequestClose={onRequestClose}
        showFooter={false}
        title={TEXT.title}
      >
        <Group.Vertical spacing="l" style={{ padding: 20 }}>
          <RiskScoreOverviewSection itemId={sexWorkerId} score={score} />
          <Group.Item marginBottom="none">
            <RiskScoreTables data={this.state.sortedRiskScoreInfo} />
          </Group.Item>
          <p style={{ fontWeight: 'bold' }}>
            {TEXT.definitions.start}
            <a
              href={OVERVIEW_DOC_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              {TEXT.definitions.end}
            </a>
          </p>
        </Group.Vertical>
      </BaseModal>
    );
  }
}
