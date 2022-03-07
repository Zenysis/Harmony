// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import DashboardTableSection from 'components/common/DashboardPickerModal/DashboardTableSection';
import DirectoryService from 'services/DirectoryService';
import Moment from 'models/core/wip/DateTime/Moment';
import Table from 'components/ui/Table';
import type { SortDirection } from 'components/ui/Table';

type DefaultProps = {
  dashboards: Zen.Array<DashboardMeta>,
  selectedDashboard?: string, // the selected dashboard's slug
  getActiveUsername: typeof DirectoryService.getActiveUsername,
};

type Props = {
  ...DefaultProps,
  onDashboardSelection: (selectedDashboardSlug: string) => void,
  searchText: string,
};

const TEXT = t('OverviewApp');
const RECENT_THRESHHOLD = new Moment().subtract(1, 'months');

export default class CollapsibleDashboardTables extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
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
  ): React.Node {
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

  renderRecentDashboardSection(): React.Node {
    const recentDashboards = this.props.dashboards
      .arrayView()
      .filter(dash =>
        dash.lastModifiedByCurrentUser().isAfter(RECENT_THRESHHOLD),
      );
    return this.renderDashboardSection(
      TEXT.dashboards.recentDashboardsTitle,
      recentDashboards,
      'lastModifiedByCurrentUser',
      Table.SortDirections.DESC,
      true,
    );
  }

  renderMyDashboardSection(): React.Node {
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

  renderOtherDashboardsSection(): React.Node {
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

  render(): React.Node {
    return (
      <React.Fragment>
        {this.renderRecentDashboardSection()}
        {this.renderMyDashboardSection()}
        {this.renderOtherDashboardsSection()}
      </React.Fragment>
    );
  }
}
