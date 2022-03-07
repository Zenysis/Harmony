// @flow
import * as React from 'react';

import AnimateHeight from 'components/ui/AnimateHeight';
import Caret from 'components/ui/Caret';
import Table from 'components/ui/Table';
import autobind from 'decorators/autobind';
import { formatDate } from 'components/Overview/util';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import type { SortDirection } from 'components/ui/Table';

const TEXT = t('OverviewApp');

const TABLE_HEADERS = [
  {
    id: 'title',
    displayContent: TEXT.dashboards.columns.title,
    style: { width: '55%' },
    searchable: d => d.title(),
    sortFn: Table.Sort.string(d => d.title()),
  },
  {
    id: 'lastModifiedByCurrentUser',
    displayContent: TEXT.dashboards.columns.lastModifiedByCurrentUser,
    sortFn: Table.Sort.moment(d => d.lastModifiedByCurrentUser()),
  },
  {
    id: 'author',
    displayContent: TEXT.dashboards.columns.owner,
    sortFn: Table.Sort.string(d => d.author()),
  },
];

type DefaultProps = {
  initialOpenState: boolean,
  selectedDashboardSlug?: string,
};

type Props = {
  ...DefaultProps,
  dashboards: $ReadOnlyArray<DashboardMeta>,
  initialColumnToSort: string,
  initialColumnSortOrder: SortDirection,
  onDashboardSelection: (selectedDashboardSlug: string) => void,
  searchText: string,
  sectionTitle: string,
};

type State = {
  showDashboards: boolean,
};

// TODO(david): Convert this component to b within an Accordion UI component
// rather than doing it's own custom accordion-like state management
export default class DashboardTableSection extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps: DefaultProps = {
    selectedDashboardSlug: undefined,
    initialOpenState: false,
  };

  state: State = {
    showDashboards: this.props.initialOpenState,
  };

  @autobind
  onToggleDashboardTable() {
    this.setState(prevState => ({
      showDashboards: !prevState.showDashboards,
    }));
  }

  @autobind
  onDashboardRowClick(dashboard: DashboardMeta) {
    this.props.onDashboardSelection(dashboard.slug());
  }

  @autobind
  renderDashboardRow(
    dashboard: DashboardMeta,
  ): React.Element<typeof Table.Row> {
    const isSelected = dashboard.slug() === this.props.selectedDashboardSlug;
    return (
      <Table.Row isSelected={isSelected} id={dashboard.slug()}>
        <Table.Cell>
          <span data-testid="save-query-modal-dashboard-title">
            {dashboard.title()}
          </span>
        </Table.Cell>
        <Table.Cell>
          {formatDate(dashboard.lastModifiedByCurrentUser())}
        </Table.Cell>
        <Table.Cell>{dashboard.author()}</Table.Cell>
      </Table.Row>
    );
  }

  render(): React.Node {
    const {
      dashboards,
      initialColumnToSort,
      initialColumnSortOrder,
      searchText,
      sectionTitle,
    } = this.props;
    const { showDashboards } = this.state;
    const caretDirection = showDashboards
      ? Caret.Directions.DOWN
      : Caret.Directions.RIGHT;

    return (
      <React.Fragment>
        <div
          className="save-query-modal__dashboard-section-header"
          role="button"
          onClick={this.onToggleDashboardTable}
        >
          <Caret
            className="save-query-modal__dashboard-caret"
            direction={caretDirection}
            size={13}
          />
          <span className="u-paragraph-text">{sectionTitle}</span>
        </div>
        <AnimateHeight
          className="save-query-modal__dashboard-table"
          height={showDashboards ? 'auto' : 0}
        >
          <Table
            noDataText={TEXT.dashboards.empty}
            headers={TABLE_HEADERS}
            data={dashboards}
            initialColumnToSort={initialColumnToSort}
            initialColumnSortOrder={initialColumnSortOrder}
            renderRow={this.renderDashboardRow}
            searchText={searchText}
            onRowClick={this.onDashboardRowClick}
          />
        </AnimateHeight>
      </React.Fragment>
    );
  }
}
