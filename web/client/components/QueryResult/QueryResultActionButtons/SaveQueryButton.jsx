// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import DashboardService from 'services/DashboardService';
import QueryResultSpec from 'models/core/QueryResultSpec';
import SaveQueryModal from 'components/QueryResult/QueryResultActionButtons/SaveQueryModal';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import ZenMap from 'util/ZenModel/ZenMap';
import autobind from 'decorators/autobind';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { localizeUrl } from 'components/Navbar/util';
import { maybeOpenNewTab } from 'util/util';
import type Dashboard from 'models/core/Dashboard';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type Props = {
  queryResultSpec: QueryResultSpec,
  querySelections: SimpleQuerySelections,
  viewType: ResultViewType,
  smallMode: boolean,

  /**
   * A callback that is invoked when the user wishes to add the given query to
   * a dashboard.
   *
   * @param {Dashboard} dashboard The dashboard to add the query to
   *
   * @param {Object} selections The selections object representing the query
   *                            and visualization parameters.
   *
   * @returns {Promise<Dashboard>} The updated dashboard with the new query.
   */
  addQueryToDashboard: typeof DashboardService.addQueryToDashboard,

  /**
   * A callback that is invoked when the user wants to retrieve a list of all
   * dashboards.
   *
   * @returns {Promise<Array<DashboardMeta>>} A listing of all the
   *                                             dashboards.
   */
  getDashboards: typeof DashboardService.getDashboards,
};

type State = {
  showSavePrompt: boolean,
  savedDashboardSlug: string,
  slugToDashboard: ZenMap<DashboardMeta>,
};

const SAVE = t('process_query.save');

class SaveQueryButton extends React.PureComponent<Props, State> {
  static defaultProps = {
    addQueryToDashboard: DashboardService.addQueryToDashboard,
    getDashboards: DashboardService.getDashboards,
    smallMode: false,
  };

  state = {
    showSavePrompt: false,
    savedDashboardSlug: '',
    slugToDashboard: ZenMap.create(),
  };

  componentDidMount() {
    this.loadDashboards();
  }

  @autobind
  closeModal() {
    this.setState({ showSavePrompt: false });
  }

  @autobind
  openModal() {
    this.setState({ showSavePrompt: true });
  }

  loadDashboards(): Promise<void> {
    return this.props.getDashboards().then(dashboards => {
      this.setState({
        slugToDashboard: ZenMap.fromArray(dashboards, 'slug'),
      });
    });
  }

  @autobind
  onSaveButtonClick() {
    this.openModal();
    analytics.track('Click save query button');
  }

  // eslint-disable-next-line class-methods-use-this
  onSaveError(error) {
    window.toastr.error(error.message);
    console.error(error);
  }

  onSaveSuccess(dashboardName: string, dashboardMeta: DashboardMeta) {
    // add the saved dashboard to our slugToDashboard map
    this.setState(prevState => ({
      slugToDashboard: prevState.slugToDashboard.set(
        dashboardMeta.slug(),
        dashboardMeta,
      ),
    }));
    analytics.track('Save Query to Dashboard', {
      dashboardName,
    });
  }

  @autobind
  onRequestNavigate(e: SyntheticMouseEvent<>) {
    maybeOpenNewTab(
      localizeUrl(`/dashboard/${this.state.savedDashboardSlug}`),
      e.metaKey,
    );
  }

  @autobind
  onRequestSave(
    dashboardName: string,
    createdDashboard: Dashboard | void = undefined,
  ) {
    const { viewType, queryResultSpec, querySelections } = this.props;
    const { slugToDashboard } = this.state;
    if (!dashboardName) {
      window.toastr.error(t('query_result.save_query.dash_name_invalid'));
      return;
    }
    const dashboard =
      createdDashboard || slugToDashboard.forceGet(dashboardName);

    this.props
      .addQueryToDashboard(
        dashboard,
        viewType,
        querySelections,
        queryResultSpec,
      )
      .then(savedDashboard => {
        this.onSaveSuccess(dashboardName, savedDashboard.getDashboardMeta());
      })
      .catch(e => this.onSaveError(e));

    if (dashboard) {
      this.setState({
        savedDashboardSlug: dashboard.slug(),
      });
    }
  }

  render() {
    const dashboards = this.state.slugToDashboard.zenValues();
    const size = this.props.smallMode
      ? Button.Sizes.SMALL
      : Button.Sizes.MEDIUM;

    return (
      <div className="aqt-query-result-action-buttons__secondary-buttons--button">
        <Button
          size={size}
          intent={Button.Intents.PRIMARY}
          onClick={this.onSaveButtonClick}
        >
          {SAVE}
        </Button>
        <SaveQueryModal
          show={this.state.showSavePrompt}
          dashboards={dashboards}
          onRequestClose={this.closeModal}
          onRequestSave={this.onRequestSave}
          onRequestNavigate={this.onRequestNavigate}
        />
      </div>
    );
  }
}

export default withScriptLoader(SaveQueryButton, VENDOR_SCRIPTS.toastr);
