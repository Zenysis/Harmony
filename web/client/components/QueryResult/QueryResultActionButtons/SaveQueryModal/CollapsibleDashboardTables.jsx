// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import DashboardTableSection from 'components/QueryResult/QueryResultActionButtons/SaveQueryModal/DashboardTableSection';
import DirectoryService from 'services/DirectoryService';
import Moment from 'models/core/wip/DateTime/Moment';
import Table from 'components/ui/Table';
import type { SortDirection } from 'components/ui/Table';

type Props = {
  onDashboardSelection: (selectedDashboardSlug: string) => void,
  searchText: string,

  dashboards: Zen.Array<DashboardMeta>,
  selectedDashboard?: string, // the selected dashboard's slug
  getActiveUsername: typeof DirectoryService.getActiveUsername,
};

const TEXT = t('OverviewApp');
const RECENT_THRESHHOLD = new Moment().subtract(1, 'months');

export default class CollapsibleDashboardTables extends React.PureComponent<Props> {
  static defaultProps = {
    dashboards: Zen.Array.create<DashboardMeta>(),
    getActiveUsername: DirectoryService.getActiveUsername,
    selectedDashboard: undefined,
  };

  renderDashboardSection(
    sectionTitle: string,
    dashboards: $ReadOnlyArray<DashboardMeta>,
    initialColumnToSort: string,
    initialColumnSortOrder?: SortDirection = Table.SortDirections.ASC,
    initialOpenState?: boolean = false,
  ) {
    const { searchText, onDashboardSelection, selectedDashboard } = this.props;
    return (
      <DashboardTableSection
        dashboards={dashboards}
        initialColumnToSort={initialColumnToSort}
        initialColumnSortOrder={initialColumnSortOrder}
        onDashboardSelection={onDashboardSelection}
        searchText={searchText}
        selectedDashboardSlug={selectedDashboard}
        sectionTitle={sectionTitle}
        initialOpenState={initialOpenState}
      />
    );
  }

  renderRecentDashboardSection() {
    const recentDashboards = this.props.dashboards
      .arrayView()
      .filter(dash => dash.lastModifiedByCurrentUser() > RECENT_THRESHHOLD);
    return this.renderDashboardSection(
      TEXT.dashboards.recentDashboardsTitle,
      recentDashboards,
      'lastModifiedByCurrentUser',
      Table.SortDirections.DESC,
      true,
    );
  }

  renderMyDashboardSection() {
    const username = this.props.getActiveUsername();
    const myDashboards = this.props.dashboards
      .arrayView()
      .filter(dash => dash.author() === username);
    return this.renderDashboardSection(
      TEXT.dashboards.userTabTitle,
      myDashboards,
      'title',
    );
  }

  renderOtherDashboardsSection() {
    const username = this.props.getActiveUsername();
    const otherDashboards = this.props.dashboards
      .arrayView()
      .filter(dash => dash.author() !== username);
    return this.renderDashboardSection(
      TEXT.dashboards.otherTabTitle,
      otherDashboards,
      'title',
    );
  }

  render() {
    return (
      <React.Fragment>
        {this.renderRecentDashboardSection()}
        {this.renderMyDashboardSection()}
        {this.renderOtherDashboardsSection()}
      </React.Fragment>
    );
  }
}
