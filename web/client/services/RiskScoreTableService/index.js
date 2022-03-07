// @flow
import Promise from 'bluebird';

import ZenClient from 'util/ZenClient';
import autobind from 'decorators/autobind';
import type { RiskScoreDataPoint } from 'services/RiskScoreTableService/types';

class RiskScoreTableService {
  _riskScoresCache: { [id: string]: $ReadOnlyArray<RiskScoreDataPoint>, ... };
  constructor() {
    this._riskScoresCache = {};
  }

  @autobind
  getRiskScoreInfo(id: string): Promise<$ReadOnlyArray<RiskScoreDataPoint>> {
    // Only request what we haven't queried yet.
    if (this._riskScoresCache[id]) {
      return new Promise(resolve => {
        resolve(this._riskScoresCache[id]);
      });
    }

    // Use the id to get the corresponding risk score info
    return new Promise((resolve, reject) => {
      ZenClient.request(`risk_score_table/${id}`)
        .then(response => {
          this._riskScoresCache[id] = response;
          resolve(this._riskScoresCache[id]);
        })
        .catch(error => reject(error));
    });
  }
}

export default (new RiskScoreTableService(): RiskScoreTableService);
