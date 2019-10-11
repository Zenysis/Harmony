// @flow
import * as React from 'react';
import Promise from 'bluebird';

import Button from 'components/ui/Button';
import Dashboard from 'models/core/Dashboard';
import DashboardService from 'services/DashboardService';
import InputModal from 'components/common/InputModal';
import autobind from 'decorators/autobind';
import { localizeUrl, onLinkClicked } from 'components/Navbar/util';

type Props = {
  className: string,
  onCreatePost?: (dashbord: Dashboard, dashboardName: string) => void,
};

type State = {
  createNewDashboard: (dashboardName: string) => Promise<Dashboard>,
  showCreateDashboardModal: boolean,
};

const TEXT = t('Navbar');
const TEXT_DASHBOARD = t('dashboard_builder');

export default class CreateDashboardButton extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps = {
    className: '',
    onCreatePost: undefined,
  };

  state = {
    createNewDashboard: DashboardService.createDashboard,
    showCreateDashboardModal: false,
  };

  @autobind
  createNewDashboard(dashboardName: string) {
    this.state
      .createNewDashboard(dashboardName)
      .then(dashboard => {
        // redirect to the new dashboard
        const { onCreatePost } = this.props;
        if (!onCreatePost) {
          onLinkClicked(
            localizeUrl(`/dashboard/${dashboard.slug()}`),
            {},
            TEXT_DASHBOARD.created,
            { dashboardName, createdInSaveToDashboardModal: false },
          );
        } else {
          onCreatePost(dashboard, dashboardName);
        }
      })
      .catch(error => {
        window.toastr.error(error.message);
        console.error(error);
        analytics.track(TEXT_DASHBOARD.creation_error, error);
      });
  }

  @autobind
  onOpenCreateDashboardModal() {
    this.setState({ showCreateDashboardModal: true });
  }

  @autobind
  onCloseCreateDashboardModal() {
    this.setState({ showCreateDashboardModal: false });
  }

  maybeRenderCreateDashboardModal() {
    if (!this.state.showCreateDashboardModal) {
      return null;
    }
    return (
      <InputModal
        show={this.state.showCreateDashboardModal}
        title={TEXT.createNewDashboard}
        textElement={TEXT.createDashboardTitlePrompt}
        onRequestClose={this.onCloseCreateDashboardModal}
        defaultHeight={260}
        primaryButtonText={TEXT.create}
        onPrimaryAction={this.createNewDashboard}
      />
    );
  }

  renderCreateDashboardButton() {
    return (
      <Button
        className={this.props.className}
        onClick={this.onOpenCreateDashboardModal}
      >
        {TEXT_DASHBOARD.create}
      </Button>
    );
  }

  render() {
    return (
      <React.Fragment>
        {this.renderCreateDashboardButton()}
        {this.maybeRenderCreateDashboardModal()}
      </React.Fragment>
    );
  }
}
