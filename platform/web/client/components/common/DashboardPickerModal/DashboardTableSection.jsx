// @flow
import * as React from 'react';

import AnimateHeight from 'components/ui/AnimateHeight';
import Caret from 'components/ui/Caret';
import I18N from 'lib/I18N';
import Table from 'components/ui/Table';
import autobind from 'decorators/autobind';
import { formatDate } from 'components/Overview/util';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import type { SortDirection } from 'components/ui/Table';

const TABLE_HEADERS = [
  {
    displayContent: I18N.textById('Name'),
    id: 'title',
    searchable: d => d.title(),
    sortFn: Table.Sort.string(d => d.title()),
    style: { width: '55%' },
  },
  {
    displayContent: I18N.text('My Last Edit'),
    id: 'lastModifiedByCurrentUser',
    sortFn: Table.Sort.moment(d => d.lastModifiedByCurrentUser()),
  },
  {
    displayContent: I18N.text('Owner'),
    id: 'author',
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
  initialColumnSortOrder: SortDirection,
  initialColumnToSort: string,
  onDashboardSelection: (selectedDashboardSlug: string) => void,
  searchText: string,
  sectionTitle: string,
};

type State = {
  showDashboards: boolean,
};

// TODO: Convert this component to b within an Accordion UI component
// rather than doing it's own custom accordion-like state management
export default class DashboardTableSection extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps: DefaultProps = {
    initialOpenState: false,
    selectedDashboardSlug: undefined,
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
      <Table.Row id={dashboard.slug()} isSelected={isSelected}>
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
      initialColumnSortOrder,
      initialColumnToSort,
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
          onClick={this.onToggleDashboardTable}
          role="button"
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
            data={dashboards}
            headers={TABLE_HEADERS}
            initialColumnSortOrder={initialColumnSortOrder}
            initialColumnToSort={initialColumnToSort}
            noDataText={I18N.text('There are no Dashboards')}
            onRowClick={this.onDashboardRowClick}
            renderRow={this.renderDashboardRow}
            searchText={searchText}
          />
        </AnimateHeight>
      </React.Fragment>
    );
  }
}
