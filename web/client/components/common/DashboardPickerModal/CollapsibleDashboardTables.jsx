// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import DashboardTableSection from 'components/common/DashboardPickerModal/DashboardTableSection';
import DirectoryService from 'services/DirectoryService';
import I18N from 'lib/I18N';
import Moment from 'models/core/wip/DateTime/Moment';
import Table from 'components/ui/Table';
import type { SortDirection } from 'components/ui/Table';

type DefaultProps = {
  dashboards: Zen.Array<DashboardMeta>,
  selectedDashboard?: string, // the selected dashboard's slug
};

type Props = {
  ...DefaultProps,
  onDashboardSelection: (selectedDashboardSlug: string) => void,
  searchText: string,
};

const RECENT_THRESHHOLD = new Moment().subtract(1, 'months');

export default class CollapsibleDashboardTables extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    dashboards: Zen.Array.create<DashboardMeta>(),
    selectedDashboard: undefined,
  };

  renderDashboardSection(
    sectionTitle: string,
    dashboards: $ReadOnlyArray<DashboardMeta>,
    initialColumnToSort: string,
    initialColumnSortOrder?: SortDirection = Table.SortDirections.ASC,
    initialOpenState?: boolean = false,
  ): React.Node {
    const { onDashboardSelection, searchText, selectedDashboard } = this.props;
    return (
      <DashboardTableSection
        dashboards={dashboards}
        initialColumnSortOrder={initialColumnSortOrder}
        initialColumnToSort={initialColumnToSort}
        initialOpenState={initialOpenState}
        onDashboardSelection={onDashboardSelection}
        searchText={searchText}
        sectionTitle={sectionTitle}
        selectedDashboardSlug={selectedDashboard}
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
      I18N.text('Recently Updated Dashboards'),
      recentDashboards,
      'lastModifiedByCurrentUser',
      Table.SortDirections.DESC,
      true,
    );
  }

  renderMyDashboardSection(): React.Node {
    const username = DirectoryService.getActiveUsername();
    const myDashboards = this.props.dashboards
      .arrayView()
      .filter(dash => dash.author() === username);
    return this.renderDashboardSection(
      I18N.text('My Dashboards'),
      myDashboards,
      'title',
    );
  }

  renderOtherDashboardsSection(): React.Node {
    const username = DirectoryService.getActiveUsername();
    const otherDashboards = this.props.dashboards
      .arrayView()
      .filter(dash => dash.author() !== username);
    return this.renderDashboardSection(
      I18N.text('Other Dashboards'),
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
