// @flow
import Promise from 'bluebird';
import invariant from 'invariant';

import APIService, { API_VERSION } from 'services/APIService';
import Dashboard from 'models/core/Dashboard';
import DashboardReportSchedule from 'services/models/DashboardReportSchedule';
import ZenError from 'util/ZenError';
import autobind from 'decorators/autobind';
import type { HTTPService } from 'services/APIService';

class DashboardReportScheduleService {
  _httpService: HTTPService;

  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  @autobind
  getDashboardReportSchedules(
    dashboard: Dashboard,
  ): Promise<Array<DashboardReportSchedule>> {
    return new Promise((resolve, reject) => {
      const uri: string = `${dashboard.uri()}/report_schedules`;
      this._httpService
        .get(API_VERSION.NONE, uri)
        .then(reports => {
          const dashboardReports = reports.map(report =>
            DashboardReportSchedule.deserialize(report),
          );
          return resolve(dashboardReports);
        })
        .catch(error => reject(new ZenError(error)));
    });
  }

  @autobind
  storeDashboardReportSchedule(
    dashboard: Dashboard,
    reportInfo: DashboardReportSchedule,
  ): Promise<DashboardReportSchedule> {
    return new Promise((resolve, reject) => {
      const uri: string = `${dashboard.uri()}/report_schedules`;
      this._httpService
        .post(API_VERSION.NONE, uri, reportInfo.serialize())
        .then(report => resolve(DashboardReportSchedule.deserialize(report)))
        .catch(error => reject(new ZenError(error)));
    });
  }

  @autobind
  deleteDashboardReportSchedule(
    dashboard: Dashboard,
    dashboardReport: DashboardReportSchedule,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const { id } = dashboardReport.modelValues();
      invariant(
        typeof id === 'number',
        'Dashboard report schedule should have an id',
      );
      const uri: string = `${dashboard.uri()}/report_schedules/${id}`;
      this._httpService
        .delete(API_VERSION.NONE, uri)
        .then(() => resolve())
        .catch(error => reject(new ZenError(error)));
    });
  }

  @autobind
  updateDashboardReportSchedule(
    dashboard: Dashboard,
    updatedDashboardReport: DashboardReportSchedule,
  ): Promise<DashboardReportSchedule> {
    return new Promise((resolve, reject) => {
      const { id } = updatedDashboardReport.modelValues();
      invariant(
        typeof id === 'number',
        'Dashboard report schedule should have an id',
      );
      const uri: string = `${dashboard.uri()}/report_schedules/${id}`;
      this._httpService
        .patch(API_VERSION.NONE, uri, updatedDashboardReport.serialize())
        .then(report => resolve(DashboardReportSchedule.deserialize(report)))
        .catch(error => reject(new ZenError(error)));
    });
  }
}

export default (new DashboardReportScheduleService(
  APIService,
): DashboardReportScheduleService);
