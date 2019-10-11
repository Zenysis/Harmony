// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';

import AlertNotification from 'models/AlertsApp/AlertNotification';
import AlertsService from 'services/AlertsService';
import AuthorizationService, {
  DASHBOARD_PERMISSIONS,
  SITE_PERMISSIONS,
  RESOURCE_TYPES,
} from 'services/AuthorizationService';
import Button from 'components/ui/Button';
import CreateDashboardButton from 'components/common/CreateDashboardButton';
import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import DashboardService from 'services/DashboardService';
import FavoriteDashboardCell from 'components/Overview/FavoriteDashboardCell';
import Heading from 'components/ui/Heading';
import InputText from 'components/ui/InputText';
import NewAlertCreationButton from 'components/AlertsApp/NewAlertCreationButton';
import Tab from 'components/ui/Tabs/Tab';
import Table from 'components/ui/Table';
import Tabs from 'components/ui/Tabs';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';
import {
  ALERT_TABLE_HEADERS,
  DASHBOARD_TABLE_HEADERS,
  QUERY_TABLE_HEADERS,
  formatDate,
} from 'components/Overview/util';
import { IndicatorLookup } from 'indicator_fields';
import { localizeUrl, onLinkClicked } from 'components/Navbar/util';
import type { QueryTableRow } from 'components/Overview/util';

// Formats for dates on this page only.
const DATE_FORMAT: string = 'D MMM YYYY';
const DATETIME_FORMAT: string = 'D MMM YYYY HH:mm:ss';
// Time in hours we should wait before rerendering dashboard thumbnail images.
const REFRESH_DASHBOARD_IMG_WAIT_TIME: number = 12;

// NOTE(all): localstorage can only set items up to 10MB
const DASHBOARD_LAST_UPDATED_KEY = 'dashboardThumbnailLastUpdated';
const LOCAL_STORAGE_DASHBOARD_IMG_KEY = 'dashboardNameToImageMap';

type State = {
  alerts: ZenArray<AlertNotification>,
  alertsLoaded: boolean,
  dashboardSearchText: string,
  dashboards: ZenArray<DashboardMeta>,
  dashboardsLoaded: boolean,
  officialDashboards: ZenArray<DashboardMeta>,
  showRecentQueries: boolean,
  showUserDashboards: boolean,
};

const TEXT = t('OverviewApp');

/**
 * Retrieve object from local storage with given key.
 */
function getObjFromStorage(key: string) {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : null;
}

/**
 * Store object into local storage.
 */
function putObjIntoStorage(key: string, obj: any) {
  localStorage.setItem(key, JSON.stringify(obj));
}

export default class Overview extends React.PureComponent<{}, State> {
  static renderToDOM(elementId: string = 'app'): void {
    const container = document.getElementById(elementId);
    if (container) {
      ReactDOM.render(<Overview />, container);
    }
  }

  state = {
    alerts: ZenArray.create(),
    alertsLoaded: false,
    dashboardSearchText: '',
    dashboards: ZenArray.create(),
    dashboardsLoaded: false,
    officialDashboards: ZenArray.create(),
    showRecentQueries: false,
    showUserDashboards: false,
  };

  constructor() {
    super();

    DashboardService.getDashboards().then(dashboards => {
      this.setState(
        {
          dashboards: ZenArray.create(dashboards),
          dashboardsLoaded: true,
          officialDashboards: ZenArray.create(
            dashboards.filter(dashboard => dashboard.isOfficial()),
          ),
        },
        () => {
          this.cleanDashboardThumbnailStorage();
          this.refreshDashboardImages();
        },
      );
    });

    AlertsService.getLatestAlertNotifications().then(alerts => {
      this.setState({
        alerts: ZenArray.create(alerts),
        alertsLoaded: true,
      });
    });

    AuthorizationService.isAuthorized(
      DASHBOARD_PERMISSIONS.CREATE,
      RESOURCE_TYPES.DASHBOARD,
    ).then(isAuthorized => {
      this.setState({
        showUserDashboards: isAuthorized,
      });
    });

    AuthorizationService.isAuthorized(
      SITE_PERMISSIONS.VIEW_QUERY_FORM,
      RESOURCE_TYPES.SITE,
      'website',
    ).then(isAuthorized => {
      this.setState({
        showRecentQueries: isAuthorized,
      });
    });
  }

  @autobind
  cleanDashboardThumbnailStorage() {
    const { officialDashboards } = this.state;
    const storedDashboardImages =
      getObjFromStorage(LOCAL_STORAGE_DASHBOARD_IMG_KEY) || {};
    const officialDashboardNames = officialDashboards.map(dashboard =>
      dashboard.slug(),
    );

    let shouldRefreshDashboardImages = false;
    Object.keys(storedDashboardImages).forEach((dashName: string) => {
      if (!officialDashboardNames.includes(dashName)) {
        shouldRefreshDashboardImages = true;
        delete storedDashboardImages[dashName];
      }
    });

    if (shouldRefreshDashboardImages) {
      putObjIntoStorage(LOCAL_STORAGE_DASHBOARD_IMG_KEY, storedDashboardImages);
    }
  }

  @autobind
  refreshDashboardImages() {
    const { officialDashboards } = this.state;
    const thumbnailLastUpdatedTime = getObjFromStorage(
      DASHBOARD_LAST_UPDATED_KEY,
    );
    const currentTime = moment(new Date());

    if (
      !thumbnailLastUpdatedTime ||
      currentTime.diff(
        moment(thumbnailLastUpdatedTime, DATETIME_FORMAT),
        'hours',
      ) > REFRESH_DASHBOARD_IMG_WAIT_TIME
    ) {
      putObjIntoStorage(
        DASHBOARD_LAST_UPDATED_KEY,
        currentTime.format(DATETIME_FORMAT),
      );

      officialDashboards.forEach((dashboard: DashboardMeta) => {
        const currDashboardLastModified = dashboard
          .lastModified()
          .format(DATETIME_FORMAT);
        const imgName = dashboard.slug();
        const dashboardImgDict =
          getObjFromStorage(LOCAL_STORAGE_DASHBOARD_IMG_KEY) || {};

        if (
          !(imgName in dashboardImgDict) ||
          currDashboardLastModified > thumbnailLastUpdatedTime
        ) {
          this.fetchAndStoreBase64Image(imgName);
        }
      });
    }
  }

  @autobind
  fetchAndStoreBase64Image(imgName: string) {
    const img = new Image();
    img.src = localizeUrl(`/dashboard/${imgName}/png/thumbnail`);

    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 800;

    const ctx = canvas.getContext('2d');
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 70, 1600, 1000, 0, 0, 1600, 800);
        const dataURL = canvas.toDataURL('image/png', 0.05);
        this.storeImageToLocalStorage(imgName, dataURL);
        this.forceUpdate();
      } catch (error) {
        throw new Error('Dashboard thumbnail image failed to load.');
      }
    };
    img.onerror = () => null;
  }

  @autobind
  storeImageToLocalStorage(imgName: string, dataURL: string) {
    const dashboardImgDict =
      getObjFromStorage(LOCAL_STORAGE_DASHBOARD_IMG_KEY) || {};
    dashboardImgDict[imgName] = dataURL;
    putObjIntoStorage(LOCAL_STORAGE_DASHBOARD_IMG_KEY, dashboardImgDict);
  }

  getQueriesRows(): Array<QueryTableRow> {
    if (!window.localStorage.querySelectionsArray) {
      return [];
    }
    return JSON.parse(window.localStorage.querySelectionsArray)
      .reverse()
      .map(query => {
        const indicators = query.fields
          .map(fieldId => IndicatorLookup[fieldId])
          .filter(ind => !!ind);
        if (indicators.length < 1) {
          return null;
        }

        const url = `/query#q=${encodeURIComponent(JSON.stringify(query))}`;
        let indTexts = indicators[0].text;
        if (indicators.length > 1) {
          indTexts += ` + ${indicators.length - 1}`;
        }
        const startDate = moment(query.startDate);
        const endDate = moment(query.endDate);
        return {
          url,
          startDate,
          endDate,
          indicators: indTexts,
          granularity: query.granularity,
        };
      })
      .filter(query => query !== null);
  }

  @autobind
  onDashboardSearchChange(dashboardSearchText: string) {
    this.setState({ dashboardSearchText });
  }

  @autobind
  onUpdateDashboardIsFavorite(dashboard: DashboardMeta, isFavorite: boolean) {
    const newDashboard = dashboard.isFavorite(isFavorite);
    const { dashboards } = this.state;
    const index = dashboards.findIndex(
      currDashboard => currDashboard.slug() === dashboard.slug(),
    );
    const newDashboards = dashboards.set(index, newDashboard);
    return this.setState({ dashboards: newDashboards }, () =>
      DashboardService.markDashboardAsFavorite(dashboard, isFavorite),
    );
  }

  onCreateAlertClicked() {
    onLinkClicked(localizeUrl('/alerts'));
  }

  onCreateQueryClicked(e: SyntheticEvent<HTMLButtonElement>) {
    onLinkClicked(localizeUrl('/query'), e);
  }

  onDashboardRowClicked(
    dashboardMeta: DashboardMeta,
    rowIdx: number,
    e: SyntheticEvent<HTMLTableRowElement>,
  ) {
    onLinkClicked(localizeUrl(`/dashboard/${dashboardMeta.slug()}`), e);
  }

  onQueryRowClicked(
    queryRow: QueryTableRow,
    rowIdx: number,
    e: SyntheticEvent<HTMLTableRowElement>,
  ) {
    onLinkClicked(localizeUrl(queryRow.url), e);
  }

  renderCreateAlertButton() {
    return (
      <div className="section-header">
        <div className="title">{TEXT.alerts.title}</div>
        <div className="overview-page__action-btn alert">
          <i className="glyphicon glyphicon-plus" />
          <NewAlertCreationButton
            onAlertDefinitionPost={this.onCreateAlertClicked}
          />
        </div>
      </div>
    );
  }

  @autobind
  renderDashboardRow(dashboard: DashboardMeta) {
    return (
      <Table.Row id={dashboard.slug()}>
        <Table.Cell>{dashboard.title()}</Table.Cell>
        <Table.Cell>
          {formatDate(dashboard.lastAccessedByCurrentUser())}
        </Table.Cell>
        <Table.Cell>
          {formatDate(dashboard.lastModifiedByCurrentUser())}
        </Table.Cell>
        <Table.Cell>{formatDate(dashboard.created())}</Table.Cell>
        <Table.Cell>{dashboard.totalViews()}</Table.Cell>
        <Table.Cell>{dashboard.totalViewsByUser()}</Table.Cell>
        <FavoriteDashboardCell
          dashboard={dashboard}
          onClick={this.onUpdateDashboardIsFavorite}
        />
      </Table.Row>
    );
  }

  renderDashboardsSection() {
    const {
      dashboards,
      dashboardSearchText,
      dashboardsLoaded,
      showUserDashboards,
    } = this.state;
    if (!dashboardsLoaded || !showUserDashboards) {
      return null;
    }
    const { username } = window.__JSON_FROM_BACKEND.user;
    const dashboardTabs: { [string]: ZenArray<DashboardMeta> } = {
      [TEXT.dashboards.userTabTitle]: dashboards.filter(
        dash => dash.author() === username,
      ),
      [TEXT.dashboards.otherTabTitle]: dashboards.filter(
        dash => dash.author() !== username,
      ),
    };

    const dashboardTables = Object.keys(dashboardTabs).map(tabName => (
      <Tab
        className="overview-page__section-contents"
        headerClassName="overview-page__section-header-spacing"
        name={tabName}
        key={tabName}
      >
        <Table
          noDataText={TEXT.dashboards.empty}
          className="overview-page-dashboard-table"
          data={dashboardTabs[tabName].arrayView()}
          headers={DASHBOARD_TABLE_HEADERS}
          renderRow={this.renderDashboardRow}
          onRowClick={this.onDashboardRowClicked}
          pageSize={5}
          initialColumnToSort="lastAccessedByCurrentUser"
          initialColumnSortOrder={Table.SortDirections.DESC}
          searchText={dashboardSearchText}
        />
      </Tab>
    ));

    return (
      <React.Fragment>
        <div className="overview-page__dashboard-action-container">
          <InputText
            className="overview-page__dashboard-search"
            placeholder={TEXT.dashboards.search}
            icon="search"
            value={dashboardSearchText}
            onChange={this.onDashboardSearchChange}
          />
          <CreateDashboardButton className="overview-page__action-btn" />
        </div>
        <Tabs className="overview-page__section-contents-spacing">
          {dashboardTables}
        </Tabs>
      </React.Fragment>
    );
  }

  renderQueryTableRow(queryRow: QueryTableRow) {
    return (
      <Table.Row>
        <Table.Cell>{queryRow.indicators}</Table.Cell>
        <Table.Cell>{queryRow.granularity}</Table.Cell>
        <Table.Cell>{queryRow.startDate.format(DATE_FORMAT)}</Table.Cell>
        <Table.Cell>{queryRow.endDate.format(DATE_FORMAT)}</Table.Cell>
      </Table.Row>
    );
  }

  renderRecentQueriesSection() {
    const { showRecentQueries } = this.state;
    if (!showRecentQueries) {
      return null;
    }
    return (
      <React.Fragment>
        <div className="overview-page__section-header overview-page__section-header-spacing">
          <Heading.Small className="overview-page__recent-queries-heading">
            {TEXT.queries.title}
          </Heading.Small>
          <Button
            className="overview-page__action-btn"
            onClick={this.onCreateQueryClicked}
          >
            {TEXT.queries.create}
          </Button>
        </div>
        <div className="overview-page__section-contents">
          <Table
            data={this.getQueriesRows()}
            headers={QUERY_TABLE_HEADERS}
            renderRow={this.renderQueryTableRow}
            noDataText={TEXT.queries.empty}
            pageSize={5}
            onRowClick={this.onQueryRowClicked}
            initialColumnToSort="indicators"
          />
        </div>
      </React.Fragment>
    );
  }

  renderAlertsTableRow(alert: AlertNotification) {
    return (
      <Table.Row id={alert.id()}>
        <Table.Cell>{alert.fieldName()}</Table.Cell>
        <Table.Cell>{alert.message()}</Table.Cell>
        <Table.Cell>{alert.dimensionDisplayName()}</Table.Cell>
      </Table.Row>
    );
  }

  renderAlertsSection() {
    // TODO(moriah): Add this section to render whenever product is ready
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
            noDataText={TEXT.alerts.empty}
            pageSize={5}
            data={alerts.arrayView()}
            headers={ALERT_TABLE_HEADERS}
            initialColumnToSort="fieldName"
            renderRow={this.renderAlertsTableRow}
          />
        </div>
      </React.Fragment>
    );
  }

  renderOfficalDashboardCards() {
    const { officialDashboards } = this.state;

    if (!officialDashboards.size()) {
      return null;
    }

    const officialCards = officialDashboards.mapValues(
      (dashboard: DashboardMeta) => {
        const dashboardImageName = dashboard.slug();
        const dashboardImgDict =
          getObjFromStorage(LOCAL_STORAGE_DASHBOARD_IMG_KEY) || [];
        if (!(dashboardImageName in dashboardImgDict)) {
          return (
            <div
              role="button"
              className="overview-page__dashboard-card"
              onClick={e =>
                onLinkClicked(
                  localizeUrl(`/dashboard/${dashboardImageName}`),
                  e,
                )
              }
              key={dashboardImageName}
            >
              <div className="overview-page__dashboard-card-header">
                {dashboard.title()}
              </div>
              <img
                className="overview-page__dashboard-image"
                src="/images/dashboard_thumbnail.png"
                alt=""
              />
            </div>
          );
        }
        return (
          <div
            role="button"
            className="overview-page__dashboard-card"
            onClick={e =>
              onLinkClicked(localizeUrl(`/dashboard/${dashboardImageName}`), e)
            }
            key={dashboardImageName}
          >
            <div className="overview-page__dashboard-card-header">
              {dashboard.title()}
            </div>
            <img
              className="overview-page__dashboard-image"
              src={dashboardImgDict[dashboardImageName]}
              alt=""
            />
          </div>
        );
      },
    );
    return (
      <React.Fragment>
        <div className="overview-page__section-header">
          <Heading.Small>{TEXT.official}</Heading.Small>
        </div>
        <div className="overview-page__official-dashboards-container">
          {officialCards}
        </div>
      </React.Fragment>
    );
  }

  render() {
    const { firstName } = window.__JSON_FROM_BACKEND.user;
    return (
      <div className="overview-page">
        <Heading.Large>
          {TEXT.welcome} {firstName}
        </Heading.Large>
        <div className="overview-page__main-content">
          {this.renderOfficalDashboardCards()}
          {this.renderDashboardsSection()}
          {this.renderRecentQueriesSection()}
        </div>
      </div>
    );
  }
}
