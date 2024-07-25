// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import DashboardSession from 'models/core/Dashboard/DashboardSession';
import GroupingItemUtil from 'models/core/wip/GroupingItem/GroupingItemUtil';
import QueryFilterItemUtil from 'models/core/wip/QueryFilterItem/QueryFilterItemUtil';
import autobind from 'decorators/autobind';
import type { DashboardSessionData } from 'models/core/Dashboard/DashboardSession';
import type { HTTPService } from 'services/APIService';

/**
 * Dashboard sessions are used to store dashboard modifiers such as group bys
 * and filters to enable sharing of these via a url hash. This service allows us
 * to store and retrieve those sessions.
 */
class DashboardSessionService {
  _httpService: HTTPService;

  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  @autobind
  getDashboardSession(sessionHash: string): Promise<DashboardSession> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, `dashboard_session/${sessionHash}`)
        .then(serializedDashboardSession =>
          DashboardSession.deserializeAsync(serializedDashboardSession)
            .then(dashboardSession => resolve(dashboardSession))
            .catch(error => reject(error)),
        )
        .catch(error => reject(error));
    });
  }

  @autobind
  storeDashboardSession(
    dashboardId: number,
    data: DashboardSessionData,
  ): Promise<string> {
    const payload = {
      dashboardId,
      dataBlob: {
        filters: QueryFilterItemUtil.serializeAppliedItems(data.filters),
        groupings: data.groupings.map(GroupingItemUtil.serialize),
      },
    };
    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, 'dashboard_session/generate_link', payload)
        .then(sessionHash => resolve(sessionHash))
        .catch(error => reject(error));
    });
  }
}

export default (new DashboardSessionService(
  APIService,
): DashboardSessionService);
