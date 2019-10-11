// @flow
import * as React from 'react';

import AuthorizationResource from 'services/models/AuthorizationResource';
import AuthorizationService, {
  RESOURCE_TYPES,
  DASHBOARD_PERMISSIONS,
} from 'services/AuthorizationService';
import BaseModal from 'components/ui/BaseModal';
import Checkbox from 'components/ui/Checkbox';
import ConfigurationService, {
  CONFIGURATION_KEY,
} from 'services/ConfigurationService';
import Dashboard from 'models/core/Dashboard';
import DashboardService from 'services/DashboardService';
import DashboardSpecification from 'models/core/Dashboard/DashboardSpecification';
import DirectoryService from 'services/DirectoryService';
import FilterPanelTab from 'components/GridDashboardApp/GridDashboardControls/DashboardSettingsModal/FilterPanelTab';
import Heading from 'components/ui/Heading';
import InputText from 'components/ui/InputText';
import LegacyButton from 'components/ui/LegacyButton';
import PublicUsersTab from 'components/GridDashboardApp/GridDashboardControls/DashboardSettingsModal/PublicUsersTab';
import RoleDefinition from 'services/models/RoleDefinition';
import Tab from 'components/ui/Tabs/Tab';
import TabbedModal from 'components/ui/TabbedModal';
import TextArea from 'components/common/TextArea';
import User from 'services/models/User';
import UserManagementTab from 'components/GridDashboardApp/GridDashboardControls/DashboardSettingsModal/UserManagementTab';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { noop } from 'util/util';
import type DashboardOptions from 'models/core/Dashboard/DashboardSpecification/DashboardOptions';
import type {
  AuthPermission,
  ResourceType,
} from 'services/AuthorizationService';

const TEXT = t('dashboard_builder.dashboard_settings');

const TAB_NAMES = {
  USER_TAB: TEXT.users_tab.title,
  PUBLIC_USER_TAB: TEXT.public_users_tab.title,
  SETTINGS_TAB: TEXT.settings_tab.title,
  FILTER_CONFIG_TAB: TEXT.filter_config_tab.title,
  SPEC_TAB: TEXT.update_specification_tab.title,
};

const INITIAL_TAB = TAB_NAMES.SETTINGS_TAB;

type Props = {
  initialDashboardOptions: DashboardOptions,
  onRequestClose: () => void,
  show: boolean,

  /** The model representing the dashboard whose settings are being displayed */
  dashboard: Dashboard,

  /**
   * The callback invoked when the user wants to delete the currently
   * selected dashboard
   */
  deleteDashboard: (dashboard: Dashboard) => Promise<void>,

  upgradeDashboard: ({
    [key: string]: mixed,
  }) => Promise<DashboardSpecification>,

  /**
   * The callback invoked when the user wants to make the currently
   * selected dashboard an official dashboard
   */
  markAsOfficial: (dashboard: Dashboard, isOfficial: boolean) => Promise<void>,

  /** The function used to query for whether public access is enabled or not */
  getPublicAccess: void => Promise<boolean>,
  getResource: (uri: string) => Promise<AuthorizationResource>,
  getRoles: void => Promise<ZenArray<RoleDefinition>>,
  getUsers: void => Promise<ZenArray<User>>,

  /**
   * Function used to check whether or not the current user has a given
   * permission on the dashboard whose settings are being viewed.
   */
  isAuthorized: (
    permission: AuthPermission,
    resourceType: ResourceType,
    resourceName: ?string,
  ) => Promise<boolean>,

  /** The callback invoked when Dashboard Options are updated */
  onDashboardOptionsChanged: (dashboardOptions: DashboardOptions) => void,

  /** The function used when the updated resource permissions are to be saved */
  updateResourcePermissions: (resource: AuthorizationResource) => Promise<void>,

  specification: DashboardSpecification,
  onUpdateSpecification: (specification: DashboardSpecification) => void,
};

type State = {
  activeTab: string,
  authorizationResource: AuthorizationResource,
  dashboardOptions: DashboardOptions,
  deleteWarningIsOpen: boolean,
  primaryAction: () => void,
  primaryButtonText: string,
  publicAccessEnabled: boolean,
  isOfficial: boolean,
};

class DashboardSettingsModal extends React.PureComponent<Props, State> {
  static defaultProps = {
    dashboard: Dashboard.create(),
    deleteDashboard: DashboardService.deleteDashboard,
    markAsOfficial: DashboardService.markDashboardAsOfficial,
    upgradeDashboard: DashboardService.upgradeDashboard,
    getPublicAccess: () =>
      ConfigurationService.getConfiguration(CONFIGURATION_KEY.PUBLIC_ACCESS),
    getResource: AuthorizationService.getResourceWithRolesByUri,
    getRoles: () =>
      AuthorizationService.getRoles(RESOURCE_TYPES.DASHBOARD).then(roles =>
        ZenArray.ofType(RoleDefinition).create(roles),
      ),
    getUsers: () =>
      DirectoryService.getUsers().then(users =>
        ZenArray.ofType(User).create(users),
      ),
    isAuthorized: AuthorizationService.isAuthorized,
    onDashboardOptionsChanged: noop,
    show: false,
    title: TEXT.title,
    updateResourcePermissions: AuthorizationService.updateResourcePermissions,
  };

  _textAreaRef: $RefObject<typeof TextArea> = React.createRef();

  _tabToAction = {
    [TAB_NAMES.USER_TAB]: {
      text: TEXT.update_users,
      action: this.updateUserRoles,
    },
    [TAB_NAMES.SETTINGS_TAB]: {
      text: TEXT.update_settings,
      action: this.updateSettings,
    },
    [TAB_NAMES.PUBLIC_USER_TAB]: {
      text: TEXT.public_users_tab.update_public_users,
      action: this.updateUserRoles,
    },
    [TAB_NAMES.SPEC_TAB]: {
      text: TEXT.update_specification_tab.update_dashboard_spec,
      action: this.updateDashboardSpecification,
    },
    [TAB_NAMES.FILTER_CONFIG_TAB]: {
      text: TEXT.filter_config_tab.update_filter_config,
      action: this.updateSettings,
    },
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      activeTab: INITIAL_TAB,
      primaryAction: this._tabToAction[INITIAL_TAB].action,
      primaryButtonText: this._tabToAction[INITIAL_TAB].text,
      deleteWarningIsOpen: false,
      publicAccessEnabled: false,
      dashboardOptions: this.props.initialDashboardOptions,
      authorizationResource: AuthorizationResource.create({
        name: '',
        label: '',
        resourceType: RESOURCE_TYPES.DASHBOARD,
      }),
      isOfficial: this.props.dashboard.isOfficial(),
    };
  }

  componentDidMount() {
    this.props.getPublicAccess().then(setting => {
      const publicAccessEnabled = setting.value();
      this.setState({ publicAccessEnabled });
    });
    this.initializeAuthorizationResource();
  }

  @autobind
  checkCanPublish(): Promise<boolean> {
    const { dashboard, isAuthorized } = this.props;
    const { slug } = dashboard.modelValues();

    return isAuthorized(
      DASHBOARD_PERMISSIONS.PUBLISH,
      RESOURCE_TYPES.DASHBOARD,
      slug,
    );
  }

  initializeAuthorizationResource(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.props
        .getResource(this.props.dashboard.authorizationUri())
        .then(authorizationResource => {
          if (!authorizationResource || !authorizationResource.roles) {
            window.toastr.error(TEXT.fetch_current_users_fail);
          } else {
            this.setState({ authorizationResource });
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  @autobind
  updateUserRoles(): Promise<void> {
    const { authorizationResource } = this.state;

    return this.props
      .updateResourcePermissions(authorizationResource)
      .then(() => {
        window.toastr.success(TEXT.permission_update_success);
        this.props.onRequestClose();
      })
      .catch(error => {
        window.toastr.error(TEXT.permission_update_error);
        console.error(JSON.stringify(error));
      });
  }

  @autobind
  updateSettings(): void {
    const { dashboardOptions, isOfficial } = this.state;
    const {
      onDashboardOptionsChanged,
      markAsOfficial,
      dashboard,
      onRequestClose,
    } = this.props;

    onDashboardOptionsChanged(dashboardOptions);
    markAsOfficial(dashboard, isOfficial);
    // TODO(pablo, vedant): remove this lint disable once we update this to use
    // Flow types
    // PropType is from the parent BaseModal and validated there
    // eslint-disable-next-line react/prop-types
    onRequestClose();
  }

  @autobind
  updateDashboardSpecification() {
    const { upgradeDashboard } = this.props;
    const specification = this._textAreaRef.current
      ? this._textAreaRef.current.getValue()
      : '';
    let parsedSpecification = {};
    try {
      parsedSpecification = JSON.parse(specification);
    } catch (error) {
      window.toastr.error(t('dashboard_builder.update_modal.bad_json'));
      console.error(JSON.stringify(error));
      return;
    }

    upgradeDashboard(parsedSpecification)
      .then((updatedSpecification: DashboardSpecification) => {
        window.toastr.success(t('dashboard_builder.update_modal.valid_spec'));
        this.props.onUpdateSpecification(updatedSpecification);
        this.props.onRequestClose();
      })
      .catch(error => {
        window.toastr.error(t('dashboard_builder.update_modal.invalid_spec'));
        console.error(JSON.stringify(error));
      });
  }

  @autobind
  updateActiveTab(newTab): void {
    const { action, text } = this._tabToAction[newTab];

    this.setState({
      primaryAction: action,
      primaryButtonText: text,
      activeTab: newTab,
    });
  }

  @autobind
  openDeleteModal(): void {
    this.setState({ deleteWarningIsOpen: true });
  }

  @autobind
  closeDeleteModal(): void {
    this.setState({ deleteWarningIsOpen: false });
  }

  @autobind
  deleteDashboard(): void {
    const { deleteDashboard, dashboard } = this.props;

    deleteDashboard(dashboard).then(() => {
      window.analytics.track(
        'Dashboard deleted',
        { dashboardName: dashboard.slug() },
        undefined,
        () => {
          window.location = '/query';
        },
      );
    });
  }

  @autobind
  onPermissionsChanged(authorizationResource: AuthorizationResource) {
    this.setState({ authorizationResource });
  }

  @autobind
  onTitleUpdate(newTitle: string) {
    const { dashboardOptions } = this.state;
    this.onDashboardOptionsUpdate(dashboardOptions.title(newTitle));
  }

  @autobind
  onDashboardOptionsUpdate(dashboardOptions) {
    this.setState({ dashboardOptions });
  }

  @autobind
  onOfficalMarkChange() {
    this.setState(prevState => ({ isOfficial: !prevState.isOfficial }));
  }

  @autobind
  onFilterPanelSettingsUpdate(newFilterPanelSettings) {
    const { dashboardOptions } = this.state;
    this.onDashboardOptionsUpdate(
      dashboardOptions.filterPanelSettings(newFilterPanelSettings),
    );
  }

  maybeRenderPublicUsersTab() {
    const {
      authorizationResource,
      activeTab,
      publicAccessEnabled,
    } = this.state;
    const { getRoles } = this.props;
    const isActiveTab = activeTab === TAB_NAMES.PUBLIC_USER_TAB;
    return (
      <Tab name={TAB_NAMES.PUBLIC_USER_TAB}>
        <PublicUsersTab
          authorizationResource={authorizationResource}
          publicAccessEnabled={publicAccessEnabled}
          checkCanPublish={this.checkCanPublish}
          getRoles={getRoles}
          isActiveTab={isActiveTab}
          onPermissionsChanged={this.onPermissionsChanged}
        />
      </Tab>
    );
  }

  renderUsersTab() {
    const { activeTab, authorizationResource } = this.state;
    const { getRoles, getUsers } = this.props;

    const isActiveTab = activeTab === TAB_NAMES.USER_TAB;
    return (
      <Tab name={TAB_NAMES.USER_TAB}>
        <UserManagementTab
          authorizationResource={authorizationResource}
          getRoles={getRoles}
          getUsers={getUsers}
          isActiveTab={isActiveTab}
          onPermissionsChanged={this.onPermissionsChanged}
        />
      </Tab>
    );
  }

  renderDeleteConfirmModal() {
    return (
      <BaseModal
        primaryButtonIntent="danger"
        onRequestClose={this.closeDeleteModal}
        show={this.state.deleteWarningIsOpen}
        title={TEXT.delete_dashboard.title}
        onPrimaryAction={this.deleteDashboard}
        defaultHeight={250}
      >
        <p>{TEXT.delete_dashboard.warning_label}</p>
      </BaseModal>
    );
  }

  renderMarkAsOfficialSection() {
    return (
      <div className="settings-block">
        <div className="settings-block__title">
          <Heading size={Heading.Sizes.SMALL}>
            {TEXT.settings_tab.official_section.title}
          </Heading>
        </div>
        <div className="settings-block__contents">
          <Checkbox
            label={TEXT.settings_tab.official_section.subtitle}
            labelPlacement="left"
            value={this.state.isOfficial}
            onChange={this.onOfficalMarkChange}
          />
        </div>
      </div>
    );
  }

  renderDeleteButton() {
    const { title } = TEXT.delete_dashboard;

    return (
      <div className="settings-block">
        <div className="settings-block__title">
          <Heading size={Heading.Sizes.SMALL}>{title}</Heading>
        </div>
        <div className="settings-block__contents">
          <LegacyButton onClick={this.openDeleteModal} type="danger">
            {title}
          </LegacyButton>
        </div>
      </div>
    );
  }

  renderTitleSection() {
    return (
      <div className="settings-block">
        <div className="settings-block__title">
          <Heading size={Heading.Sizes.SMALL}>
            {TEXT.settings_tab.title_section.heading}
          </Heading>
        </div>
        <div className="settings-block__contents">
          <InputText
            value={this.state.dashboardOptions.title()}
            onChange={this.onTitleUpdate}
          />
        </div>
      </div>
    );
  }

  renderGeneralSettingsTab() {
    return (
      <Tab
        name={TAB_NAMES.SETTINGS_TAB}
        testId="dashboard-general-settings-tab"
      >
        <div className="general-settings-tab">
          {this.renderTitleSection()}
          {this.renderMarkAsOfficialSection()}
          {this.renderDeleteButton()}
        </div>
      </Tab>
    );
  }

  renderFilterPanelConfigTab() {
    const { dashboardOptions } = this.state;

    return (
      <Tab name={TAB_NAMES.FILTER_CONFIG_TAB}>
        <FilterPanelTab
          onFilterPanelSettingsUpdate={this.onFilterPanelSettingsUpdate}
          filterPanelSettings={dashboardOptions.filterPanelSettings()}
        />
      </Tab>
    );
  }

  renderEditSpecificationTab() {
    const specJson = JSON.stringify(
      this.props.specification.serialize(),
      null,
      2,
    );
    return (
      <Tab name={TAB_NAMES.SPEC_TAB}>
        <p>{t('dashboard_builder.paste_json')}</p>
        <TextArea
          ref={this._textAreaRef}
          initialValue={specJson}
          maxHeight="85%"
        />
      </Tab>
    );
  }

  render() {
    const { show, onRequestClose } = this.props;
    return (
      <span className="dashboard-settings">
        <TabbedModal
          showPrimaryButton
          onPrimaryAction={this.state.primaryAction}
          primaryButtonText={this.state.primaryButtonText}
          width={window.innerWidth * 0.8}
          defaultHeight={window.innerHeight * 0.8}
          onTabChange={this.updateActiveTab}
          initialTab={INITIAL_TAB}
          show={show}
          onRequestClose={onRequestClose}
        >
          {this.renderGeneralSettingsTab()}
          {this.renderFilterPanelConfigTab()}
          {this.renderUsersTab()}
          {this.maybeRenderPublicUsersTab()}
          {this.renderEditSpecificationTab()}
        </TabbedModal>
        {this.renderDeleteConfirmModal()}
      </span>
    );
  }
}

export default withScriptLoader(DashboardSettingsModal, VENDOR_SCRIPTS.toastr);
