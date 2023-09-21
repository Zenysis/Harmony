// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import CreateDashboardModal from 'components/common/CreateDashboardModal';
import I18N from 'lib/I18N';
import autobind from 'decorators/autobind';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';

type DefaultProps = {
  className: string,
  onCreatePost?: (dashbord: DashboardMeta, dashboardName: string) => void,
};

type Props = DefaultProps;

type State = {
  showCreateDashboardModal: boolean,
};

export default class CreateDashboardButton extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps: DefaultProps = {
    className: '',
    onCreatePost: undefined,
  };

  state: State = {
    showCreateDashboardModal: false,
  };

  @autobind
  onOpenCreateDashboardModal() {
    this.setState({ showCreateDashboardModal: true });
  }

  @autobind
  onCloseCreateDashboardModal() {
    this.setState({ showCreateDashboardModal: false });
  }

  renderCreateDashboardModal(): React.Element<typeof CreateDashboardModal> {
    return (
      <CreateDashboardModal
        onCreatePost={this.props.onCreatePost}
        onRequestClose={this.onCloseCreateDashboardModal}
        show={this.state.showCreateDashboardModal}
      />
    );
  }

  renderCreateDashboardButton(): React.Node {
    return (
      <Button
        className={this.props.className}
        onClick={this.onOpenCreateDashboardModal}
        testId="create-dashboard-button"
      >
        <I18N>Create Dashboard</I18N>
      </Button>
    );
  }

  render(): React.Node {
    return (
      <React.Fragment>
        {this.renderCreateDashboardButton()}
        {this.renderCreateDashboardModal()}
      </React.Fragment>
    );
  }
}
