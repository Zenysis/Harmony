// @flow
import * as React from 'react';

import Icon from 'components/ui/Icon';
import Table from 'components/ui/Table';
import autobind from 'decorators/autobind';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';

type Props = {
  dashboard: DashboardMeta,
  onClick: (dashboard: DashboardMeta, isFavorite: boolean) => void,
};

// TODO(pablo): change this to a stateless functional component using hooks
// once we upgrade to React v16.8
export default class FavoriteDashboardCell extends React.PureComponent<Props> {
  @autobind
  onClick(event: SyntheticEvent<HTMLSpanElement>) {
    event.stopPropagation();
    const { onClick, dashboard } = this.props;
    onClick(dashboard, !dashboard.isFavorite());
  }

  render(): React.Element<typeof Table.Cell> {
    const { dashboard } = this.props;
    const favoriteIconType = dashboard.isFavorite() ? 'star' : 'star-empty';
    return (
      <Table.Cell className="overview-page-dashboard-table__favorite-dashboard-cell">
        <Icon onClick={this.onClick} type={favoriteIconType} />
      </Table.Cell>
    );
  }
}
