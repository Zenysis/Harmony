// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';

import * as Zen from 'lib/Zen';
import AlertNotification from 'models/AlertsApp/AlertNotification';
import AlertsService from 'services/AlertsService';
import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import DashboardService from 'services/DashboardBuilderApp/DashboardService';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import NewAlertCreationButton from 'components/AlertsApp/NewAlertCreationButton';
import OfficialDashboardCards from 'components/Overview/OfficialDashboardCards';
import TabbedDashboardsTable from 'components/Overview/TabbedDashboardsTable';
import Table from 'components/ui/Table';
import ThumbnailStorageService from 'services/ThumbnailStorageService';
import autobind from 'decorators/autobind';
import { ALERT_TABLE_HEADERS } from 'components/Overview/util';
import {
  isMobileView,
  localizeUrl,
  onLinkClicked,
} from 'components/Navbar/util';

// Can't send byte objects via flask so we're sending a string
// and reformatting into base64 here.
function formatBase64(value: string) {
  return `data:image/png;base64,${value}`;
}

type State = {
  alerts: Zen.Array<AlertNotification>,
  alertsLoaded: boolean,
  dashboardImgMap: Zen.Map<string>,
  dashboards: Zen.Array<DashboardMeta>,
  dashboardsLoaded: boolean,
  dashboardThumbnailsLoaded: boolean,
  officialDashboards: Zen.Array<DashboardMeta>,
  showFeedMobile: boolean,
};

// TODO: This file is a little bit bloated. We should extract
// out the alerts table and recent queries sections into seperate
// components
export default class Overview extends React.PureComponent<{}, State> {
  static renderToDOM(elementId: string = 'app'): void {
    const container = document.getElementById(elementId);
    if (container) {
      ReactDOM.render(<Overview />, container);
    }
  }

  state: State = {
    alerts: Zen.Array.create(),
    alertsLoaded: false,
    dashboardImgMap: Zen.Map.create(),
    dashboardThumbnailsLoaded: false,
    dashboards: Zen.Array.create(),
    dashboardsLoaded: false,
    officialDashboards: Zen.Array.create(),
    showFeedMobile: false,
  };

  constructor() {
    super();
    // TODO: Dependency inject these service calls as props,
    // refactor them into seperate methods, and call them from componentDidMount
    // rather than the constructor.

    // NOTE: Fetch official dashboards first so that their thumbnails
    // can begin loading ASAP. Also it helps fill out the structure of the page.
    DashboardService.getViewableOfficialDashboards().then(dashboards => {
      const officialDashboards = Zen.Array.create(dashboards);
      this.setState({ officialDashboards });
      this.loadDashboardThumbnailImgs(officialDashboards);
    });

    DashboardService.getDashboards().then(dashboards => {
      this.setState({
        dashboards: Zen.Array.create(dashboards),
        dashboardsLoaded: true,
      });
    });

    AlertsService.getLatestAlertNotifications().then(alerts => {
      this.setState({
        alerts: Zen.Array.create(alerts),
        alertsLoaded: true,
      });
    });
  }

  componentDidMount() {
    window.testing.overviewMounted = true;
  }

  loadDashboardThumbnailImgs(officialDashboards: Zen.Array<DashboardMeta>) {
    if (
      !window.__JSON_FROM_BACKEND.IS_PRODUCTION ||
      !officialDashboards.size()
    ) {
      this.setState({ dashboardThumbnailsLoaded: true });
      return;
    }

    let thumbnailsToLoad = officialDashboards.size();
    officialDashboards.forEach(dashboard => {
      const dashboardName = dashboard.slug();
      ThumbnailStorageService.retrieveFromStorage(dashboardName).then(value => {
        thumbnailsToLoad -= 1;
        this.setState(({ dashboardImgMap }) => ({
          dashboardImgMap: value
            ? dashboardImgMap.set(dashboardName, formatBase64(value))
            : dashboardImgMap,
          dashboardThumbnailsLoaded: thumbnailsToLoad === 0,
        }));
      });
    });
  }

  @autobind
  onUpdateDashboardIsFavorite(
    dashboard: DashboardMeta,
    isFavorite: boolean,
  ): void {
    const newDashboard = dashboard.isFavorite(isFavorite);
    const { dashboards } = this.state;
    const index = dashboards.findIndex(
      currDashboard => currDashboard.slug() === dashboard.slug(),
    );
    const newDashboards = dashboards.set(index, newDashboard);
    this.setState({ dashboards: newDashboards }, () =>
      DashboardService.markDashboardAsFavorite(dashboard, isFavorite),
    );
  }

  onCreateAlertClicked() {
    onLinkClicked(localizeUrl('/alerts'));
  }

  maybeRenderOfficalDashboardCards(): React.Node {
    const {
      dashboardImgMap,
      dashboardThumbnailsLoaded,
      officialDashboards,
    } = this.state;

    if (dashboardThumbnailsLoaded && officialDashboards.isEmpty()) {
      return null;
    }

    return (
      <OfficialDashboardCards
        dashboardImgMap={dashboardImgMap}
        officialDashboards={officialDashboards}
      />
    );
  }

  renderCreateAlertButton(): React.Node {
    return (
      <div className="section-header">
        <div className="title">{I18N.textById('Alerts')}</div>
        <div className="dashboards-overview__action-btn alert">
          <i className="glyphicon glyphicon-plus" />
          <NewAlertCreationButton
            onAlertDefinitionPost={this.onCreateAlertClicked}
          />
        </div>
      </div>
    );
  }

  renderDashboardsSection(): React.Node {
    const { dashboards, dashboardsLoaded } = this.state;
    return (
      <TabbedDashboardsTable
        dashboards={dashboards}
        dashboardsLoaded={dashboardsLoaded}
        onUpdateDashboardIsFavorite={this.onUpdateDashboardIsFavorite}
        showUserDashboards
      />
    );
  }

  renderAlertsTableRow(
    alert: AlertNotification,
  ): React.Element<typeof Table.Row> {
    return (
      <Table.Row id={alert.id()}>
        <Table.Cell>{alert.title()}</Table.Cell>
        <Table.Cell>{alert.getCondition()}</Table.Cell>
        <Table.Cell>{alert.dimensionDisplayName()}</Table.Cell>
      </Table.Row>
    );
  }

  renderAlertsSection(): React.Node {
    // TODO: Add this section to render whenever product is ready
    // for it.
    const { alertsOptions } = window.__JSON_FROM_BACKEND;
    const alertsEnabled = alertsOptions ? alertsOptions.length : false;
    const { alerts, alertsLoaded } = this.state;
    if (!alertsEnabled || !alertsLoaded) {
      return null;
    }
    return (
      <React.Fragment>
        {this.renderCreateAlertButton()}
        <div className="table-container">
          <Table
            data={alerts.arrayView()}
            headers={ALERT_TABLE_HEADERS}
            initialColumnToSort="name"
            noDataText={I18N.text('There are no Alerts')}
            pageSize={5}
            renderRow={this.renderAlertsTableRow}
            searchText={I18N.text('Search Alert Names...')}
          />
        </div>
      </React.Fragment>
    );
  }

  renderHeadSection(): React.Node {
    const { firstName } = window.__JSON_FROM_BACKEND.user;

    return (
      <div className="dashboards-overview__head">
        <Heading.Large className="dashboards-overview__head-title">
          {I18N.text('Welcome, %(firstName)s', { firstName })}
        </Heading.Large>
      </div>
    );
  }

  render(): React.Node {
    const dashboardsOverviewClass = 'dashboards-overview';

    const overview = (
      <React.Fragment>
        <div className={dashboardsOverviewClass} data-testid="overview-page">
          {this.renderHeadSection()}
          <div className="dashboards-overview__main-content">
            {this.maybeRenderOfficalDashboardCards()}
            {this.renderDashboardsSection()}
          </div>
        </div>
      </React.Fragment>
    );

    return overview;
  }
}
