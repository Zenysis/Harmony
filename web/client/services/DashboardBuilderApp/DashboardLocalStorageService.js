// @flow
import Promise from 'bluebird';

import Dashboard from 'models/core/Dashboard';
import DashboardSpecification, {
  EXPECTED_VERSION,
} from 'models/core/Dashboard/DashboardSpecification';
import DirectoryService from 'services/DirectoryService';
import LocalStorageService from 'services/LocalStorageService';

class DashboardLocalStorageService {
  _directoryService: typeof DirectoryService;

  constructor(directoryService: typeof DirectoryService) {
    this._directoryService = directoryService;
  }

  getKey(dashboardURI: string): string {
    const username = this._directoryService.getActiveUsername();
    return `${dashboardURI}_${username}`;
  }

  saveDashboardSpec(dashboard: Dashboard): void {
    const key = this.getKey(dashboard.uri());
    LocalStorageService.setItem(
      key,
      JSON.stringify(dashboard.serializeForSpecUpdate().specification),
    );
  }

  getDashboardSpec(
    dashboardURI: string,
  ): Promise<DashboardSpecification | null> {
    const key = this.getKey(dashboardURI);
    const dashboardSpec = LocalStorageService.getItem(key);

    if (!dashboardSpec) {
      return Promise.resolve(null);
    }

    const parsedSpec = JSON.parse(dashboardSpec);

    if (parsedSpec.version !== EXPECTED_VERSION) {
      // If there is a version mismatch we cannot deserialize the dashboard spec
      // so it should be removed.
      this.removeDashboardSpec(dashboardURI);
      return Promise.resolve(null);
    }

    return DashboardSpecification.deserializeAsync(parsedSpec);
  }

  removeDashboardSpec(dashboardURI: string): void {
    const key = this.getKey(dashboardURI);
    LocalStorageService.removeItem(key);
  }
}

export default (new DashboardLocalStorageService(
  DirectoryService,
): DashboardLocalStorageService);
