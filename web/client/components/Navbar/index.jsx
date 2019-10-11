import Promise from 'bluebird';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import AuthorizationService, {
  RESOURCE_TYPES,
  SITE_PERMISSIONS,
  DASHBOARD_PERMISSIONS,
} from 'services/AuthorizationService'; // eslint-disable-line import/extensions
import CollapsibleLink from 'components/Navbar/CollapsibleLink';
import ConfigurationService, {
  CONFIGURATION_KEY,
} from 'services/ConfigurationService';
import DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import DashboardService from 'services/DashboardService';
import DashboardsDropdown from 'components/common/DashboardsDropdown';
import Dropdown from 'components/ui/Dropdown';
import Icon from 'components/ui/Icon';
import InputModal from 'components/common/InputModal';
import MoreLinks from 'components/Navbar/MoreLinks';
import NavigationDropdown from 'components/Navbar/NavigationDropdown';
import ZenArray from 'util/ZenModel/ZenArray';
import { CARET_TYPES } from 'components/ui/Caret';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import {
  asButton,
  asDropdownOption,
  localizeUrl,
  onLinkClicked,
  isMobileBrowser,
  isForbiddenPath,
} from 'components/Navbar/util';
import { autobind } from 'decorators';
import { noop } from 'util/util';

const propTypes = {
  flagClass: PropTypes.string,
  fullPlatformName: PropTypes.string.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
  logoPath: PropTypes.string,
  username: PropTypes.string.isRequired,
  visibleName: PropTypes.string,

  checkCanViewQueryForm: PropTypes.func,

  /**
   * A callback that is invoked when the user wishes to create a new dashboard.
   *
   * @param {String} dashboardTitle The title for the new dashboard
   *
   * @returns {Promise<Dashboard>} The created dashboard.
   */
  createDashboard: PropTypes.func,

  /**
   * A callback that is invoked when the user wants to retrieve a list of all
   * dashboards.
   *
   * @returns {Promise<ZenArray<DashboardMeta>>} A listing of all the
   *                                             dashboards.
   */
  getDashboards: PropTypes.func,

  /**
   * A callback to test whether public access is enabled for this session.
   *
   * @returns {Promise<Configuration>} The public access configuration value.
   */
  getPublicAccess: PropTypes.func,

  lastDataUpdate: PropTypes.string,
  checkCanCreateDashboards: PropTypes.func, // f().then(isAuthorized: bool)
  checkIsAdmin: PropTypes.func, // f().then(isAdmin: bool)
};

const defaultProps = {
  visibleName: '',
  flagClass: '',
  logoPath: '',
  createDashboard: DashboardService.createDashboard,
  getDashboards: () =>
    DashboardService.getDashboards().then(dashboards =>
      ZenArray.ofType(DashboardMeta).create(dashboards),
    ),
  lastDataUpdate: null,
  checkCanCreateDashboards: () =>
    AuthorizationService.isAuthorized(
      DASHBOARD_PERMISSIONS.CREATE,
      RESOURCE_TYPES.DASHBOARD,
    ),
  checkIsAdmin: () =>
    AuthorizationService.isAuthorized(
      SITE_PERMISSIONS.VIEW_ADMIN_PAGE,
      RESOURCE_TYPES.SITE,
    ),
  checkCanViewQueryForm: () =>
    AuthorizationService.isAuthorized(
      SITE_PERMISSIONS.VIEW_QUERY_FORM,
      RESOURCE_TYPES.SITE,
      'website',
    ),
  getPublicAccess: () =>
    ConfigurationService.getConfiguration(CONFIGURATION_KEY.PUBLIC_ACCESS),
};

const ALERTS_URL = '/alerts';
const CASE_MANAGEMENT_URL = '/case-management';
const DATA_QUALITY_URL = '/data-quality';
const FORBIDDEN_PATH_KEY = 'FORBIDDEN_MOBILE_PATH_MESSAGE';

const TEXT = t('Navbar');
// Matches navbar-transition-width in _zen_variables.scss
const TRANSITION_WIDTH = 1250;

// The width to switch from full deployment name to an acronym
const SHOW_ACRONYM_WIDTH = 1296;

// The width to consider putting the last 2 items in the more dropdown
const HIDE_TWO_WIDTH = 1024;

// The width to consider putting the last 3 items in the more dropdown
const HIDE_THREE_WIDTH = 800;

// The width below which we should switch to the mobile view
const MOBILE_VIEW_WIDTH = 678;

function onSelection(value, e) {
  // The value stored is an onClick event we want to use.
  value(e);
}

function isSmall() {
  return $(window).width() < TRANSITION_WIDTH;
}

function isMobileView() {
  return $(window).width() < MOBILE_VIEW_WIDTH;
}

function showAcronym() {
  return $(window).width() < SHOW_ACRONYM_WIDTH;
}

function getMoreOptionsCount() {
  const deviceWidth = $(window).width();

  if (deviceWidth <= HIDE_THREE_WIDTH) {
    return 3;
  }

  if (deviceWidth <= HIDE_TWO_WIDTH) {
    return 2;
  }

  return 0;
}

/**
 * @param {string} deploymentName The name of the whose acronym we want to find
 * @returns {string} The acronym of the deployment. Returns the same word if
 * the deployment name has a single word e.g. NACOSA and an acronym e.g EHDAP
 * for Ethiopia
 */
function extractAcronym(deploymentName) {
  const wordsInName = deploymentName.trim().split(/\s+/);
  const hasSingleWord = wordsInName.length === 1;

  if (hasSingleWord) {
    return deploymentName;
  }

  // combine first letters of each word
  const acronym = wordsInName
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();

  return acronym;
}

class Navbar extends React.PureComponent {
  static renderToDOM(navbarProps = {}, elementId = 'header') {
    const { ui, user } = window.__JSON_FROM_BACKEND;
    const { isAuthenticated, username, lastName, firstName } = user;
    const visibleName = firstName || lastName;
    const { fullPlatformName, flagClass, logoPath, lastDataUpdate } = ui;
    const props = Object.assign(
      {
        fullPlatformName,
        flagClass,
        logoPath,
        isAuthenticated,
        lastDataUpdate,
        username,
        visibleName,
      },
      navbarProps,
    );

    ReactDOM.render(<Navbar {...props} />, document.getElementById(elementId));
  }

  constructor(props) {
    super(props);
    this.state = {
      dashboards: ZenArray.create(),
      canViewQueryForm: false,
      canCreateDashboards: false,
      isAdmin: false,
      showCreateDashboardModal: false,
      areDashboardsLoading: true,
      small: isSmall(),
      showAcronym: showAcronym(),
      moreOptionsCount: getMoreOptionsCount(),
      isMobileView: isMobileView(),
      openDrawer: false,
    };

    // prettier-ignore
    this.openCreateDashboardModal =
      this.setCreateDashboardModalVisibility.bind(this, true);
    // prettier-ignore
    this.closeCreateDashboardModal =
      this.setCreateDashboardModalVisibility.bind(this, false);
    this.createNewDashboard = this.createNewDashboard.bind(this);
    this.onDashboardSelection = this.onDashboardSelection.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.onOpenDashboardDropdown = this.onOpenDashboardDropdown.bind(this);
  }

  componentDidMount() {
    this.maybeRedirectOnMobile();
    this.initializeDashboardsAndPermissions();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('online', this.handleOnline);
    // Load toastr after the component mounts so that we do not delay the
    // rendering of the navbar.
    // TODO(stephen): It'd be nice to get rid of this preload dependency
    // altogether, but I have a feeling that other uses of toastr around the
    // site will break because they don't check if it is loaded.
    VENDOR_SCRIPTS.toastr.load();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('online', this.handleOnline);
  }

  maybeRedirectOnMobile() {
    const path = window.location.pathname;
    const errorMessage = localStorage.getItem(FORBIDDEN_PATH_KEY);

    if (isMobileBrowser() && isForbiddenPath(path)) {
      window.location.replace(`${window.location.origin}/query`);
      localStorage.setItem(
        FORBIDDEN_PATH_KEY,
        JSON.stringify(TEXT.mobileForbiddenError),
      );
    }

    if (errorMessage) {
      window.toastr.error(JSON.parse(errorMessage));
      localStorage.removeItem(FORBIDDEN_PATH_KEY);
    }
  }

  createNewDashboard(dashboardName) {
    this.props
      .createDashboard(dashboardName)
      .then(dashboard => {
        // redirect to the new dashboard
        onLinkClicked(
          localizeUrl(`/dashboard/${dashboard.slug()}`),
          {},
          'Dashboard created',
          { dashboardName, createdInSaveToDashboardModal: false },
        );
      })
      .catch(error => {
        toastr.error(error.message);
        console.error(error);
        analytics.track('Dashboard creation error', error);
      });
  }

  handleResize() {
    this.setState({
      small: isSmall(),
      showAcronym: showAcronym(),
      moreOptionsCount: getMoreOptionsCount(),
      isMobileView: isMobileView(),
    });
  }

  initializeDashboardsAndPermissions() {
    // If the user is authenticated or public access is enabled, we can
    // initialize the dashboards and user permissions.
    // HACK(stephen): Ignore getPublicAccess errors since the configuration API
    // requires authorization at this time if public portal is disabled.
    const accessPromise = this.props.isAuthenticated
      ? Promise.resolve(true)
      : this.props
          .getPublicAccess()
          .then(setting => setting.value())
          .catch(noop);

    // Fetch the latest dashboards and retrieve the user's permissions.
    accessPromise.then(canAccess => {
      if (canAccess) {
        this.updateDashboardList();
        this.props.checkCanCreateDashboards().then(canCreateDashboards => {
          this.setState({ canCreateDashboards });
        });
        this.props.checkIsAdmin().then(isAdmin => {
          this.setState({ isAdmin });
        });
        this.props.checkCanViewQueryForm().then(canViewQueryForm => {
          this.setState({ canViewQueryForm });
        });
      }
    });
  }

  updateDashboardList() {
    this.setState({ areDashboardsLoading: true });
    this.props.getDashboards().then(dashboards => {
      this.setState({
        dashboards,
        areDashboardsLoading: false,
      });
    });
  }

  handleOffline() {
    window.toastr.clear();

    // prevent toast from closing based on timeouts
    window.toastr.options.timeOut = 0;
    window.toastr.options.extendedTimeOut = 0;
    window.toastr.options.closeButton = true;
    window.toastr.error(TEXT.offlineError);
  }

  handleOnline() {
    // restore the defaults. See toastr source code for defaults clarity
    // https://github.com/CodeSeven/toastr/blob/master/toastr.js
    window.toastr.options.timeOut = 5000;
    window.toastr.options.extendedTimeOut = 1000;
    window.toastr.options.closeButton = false;
    window.toastr.clear();
  }

  setCreateDashboardModalVisibility(showModal) {
    this.setState({ showCreateDashboardModal: showModal });
  }

  getSummaryInfo() {
    const { isAuthenticated, lastDataUpdate, username } = this.props;
    const userStatus = isAuthenticated
      ? this.renderDropdownTitleItem(TEXT.loggedInAs, username)
      : null;
    const dataUpdate =
      lastDataUpdate
        ? this.renderDropdownTitleItem(TEXT.lastDataRefresh, lastDataUpdate)
        : null;

    const { isAdmin } = window.__JSON_FROM_BACKEND.user;
    const { buildTag } = window.__JSON_FROM_BACKEND;
    const versionInfo = isAdmin
      ? this.renderDropdownTitleItem(TEXT.buildVersion, buildTag)
      : null;
    return {
      userStatus,
      dataUpdate,
      versionInfo,
    };
  }

  @autobind
  onDashboardSelection(dashboard, e) {
    onLinkClicked(
      localizeUrl(`/dashboard/${dashboard}`),
      e,
      undefined /* analyticsEvent */,
      undefined /* analyticsProperties */,
      true /* openNewTab */,
    );
  }

  onOpenDashboardDropdown() {
    this.updateDashboardList();
  }

  onHomeClicked(e) {
    onLinkClicked(localizeUrl('/overview'), e);
  }

  @autobind
  onHamburgerClick(e) {
    e.preventDefault();
    this.setState(prevState => ({
      openDrawer: !prevState.openDrawer,
    }));
  }

  @autobind
  maybeRenderAnalyzeLink(isDropdownOption = false, showDropdownIcon = true) {
    const { isAuthenticated } = this.props;
    const { canViewQueryForm } = this.state;
    if (!isAuthenticated || !canViewQueryForm) {
      return null;
    }
    const url = localizeUrl('/query');
    const isActive = window.location.pathname.includes(url);
    const iconClassName = showDropdownIcon ? 'glyphicon glyphicon-search' : '';

    if (isDropdownOption) {
      return asDropdownOption(
        e => onLinkClicked(url, e),
        TEXT.analyze,
        iconClassName,
      );
    }

    return asButton(e => onLinkClicked(url, e), TEXT.analyze, isActive);
  }

  maybeRenderCreateDashboardModal() {
    if (this.state.showCreateDashboardModal) {
      return (
        <InputModal
          show={this.state.showCreateDashboardModal}
          title={TEXT.createNewDashboard}
          textElement={TEXT.createDashboardTitlePrompt}
          onRequestClose={this.closeCreateDashboardModal}
          defaultHeight={260}
          primaryButtonText={TEXT.create}
          onPrimaryAction={this.createNewDashboard}
        />
      );
    }

    return null;
  }

  @autobind
  maybeRenderDashboardsDropdown() {
    const { isAuthenticated } = window.__JSON_FROM_BACKEND.user;
    if (!isAuthenticated) {
      // Don't render dashboards dropdown for public users who have their own
      // special dropdowns.
      return null;
    }

    // If the current viewer can view any Dashboards, then render this dropdown.
    if (this.state.canCreateDashboards || this.state.dashboards.size() > 0) {
      const isActive = window.location.pathname.includes('/dashboard');
      const className = classNames(
        'navbar__item navbar__item--link navbar__item--link-offset',
        {
          'navbar__item--active': isActive,
        },
      );

      return (
        <div className={className} key="dashboards-dropdown">
          <DashboardsDropdown
            className="navbar-dropdown navbar-dashboards-dropdown"
            dashboards={this.state.dashboards}
            defaultDisplayContent={TEXT.dashboardsDropdownLabel}
            onDashboardSelection={this.onDashboardSelection}
            onNewDashboardClick={this.openCreateDashboardModal}
            showLoadingSpinner={this.state.areDashboardsLoading}
            canCreateDashboards={this.state.canCreateDashboards}
            onOpenDropdownClick={this.onOpenDashboardDropdown}
            useDashboardGroups={isAuthenticated}
          />
        </div>
      );
    }
    return null;
  }

  maybeRenderLastDataRefresh() {
    const { lastDataUpdate } = this.props;
    if (lastDataUpdate) {
      if (this.state.small) {
        return <p>{`${TEXT.lastDataRefresh}: ${lastDataUpdate}`}</p>;
      }
      return ` | ${TEXT.lastDataRefresh}: ${lastDataUpdate}`;
    }
    return null;
  }

  maybeRenderLoggedInStatus() {
    const { isAuthenticated, username } = this.props;
    if (isAuthenticated) {
      return ` | ${TEXT.loggedInAs} ${username}`;
    }
    return null;
  }

  maybeRenderUserManualLink(isDropdownOption = false) {
    const { userManualUrl } = window.__JSON_FROM_BACKEND.ui;
    if (userManualUrl && this.props.isAuthenticated) {
      const wrapper = isDropdownOption ? asDropdownOption : asButton;
      return wrapper(
        e =>
          onLinkClicked(userManualUrl, e, 'User manual accessed', {
            nonInteraction: 1,
          }),
        TEXT.userManual,
        'glyphicon glyphicon-briefcase',
      );
    }
    return null;
  }

  @autobind
  maybeRenderCaseManagementLink(
    isDropdownOption = false,
    showDropdownIcon = true,
  ) {
    const { isAuthenticated } = this.props;
    const { caseManagementAppOptions } = window.__JSON_FROM_BACKEND;
    if (
      isAuthenticated &&
      caseManagementAppOptions !== undefined &&
      caseManagementAppOptions.showInNavbar &&
      !isMobileBrowser()
    ) {
      const url = localizeUrl(CASE_MANAGEMENT_URL);
      const isActive = window.location.pathname.includes(url);
      const iconClassName = showDropdownIcon
        ? 'glyphicon glyphicon-folder-open'
        : '';

      if (isDropdownOption) {
        return asDropdownOption(
          e => onLinkClicked(url, e),
          // TODO(pablo): the CMA title should be handled through a config,
          // not hardcoded in the JSON_FROM_BACKEND
          caseManagementAppOptions.navbarTitle,
          iconClassName,
        );
      }

      return asButton(
        e => onLinkClicked(url, e),
        caseManagementAppOptions.navbarTitle,
        isActive,
      );
    }
    return null;
  }

  maybeRenderDrawer() {
    const { isAuthenticated, visibleName } = this.props;
    const { ui, locales } = window.__JSON_FROM_BACKEND;

    if (!this.state.openDrawer) {
      return null;
    }

    return (
      <div className="navbar__menu-container">
        {this.renderMobileSummaryInfo()}
        <div>
          {this.maybeRenderAnalyzeLink()}
          {this.maybeRenderDataQualityLink()}
          {this.maybeRenderCaseManagementLink()}
          {this.maybeRenderAlertsLink()}
        </div>
        <CollapsibleLink
          label="More"
          className="navbar-item__more-links"
          openClassName="navbar-item__more-links--open"
        >
          <MoreLinks
            linksAsDropdownOptions={false}
            isAdmin={this.state.isAdmin}
            isAuthenticated={isAuthenticated}
            showLocales={ui.showLocalePicker}
            locales={locales}
            visibleName={visibleName}
          />
        </CollapsibleLink>
      </div>
    );
  }

  @autobind
  maybeRenderAlertsLink(isDropdownOption = false, showDropdownIcon = true) {
    const { isAuthenticated } = this.props;
    const { alertsOptions } = window.__JSON_FROM_BACKEND;
    const alertsEnabled = alertsOptions ? alertsOptions.length : false;
    if (!isAuthenticated || !alertsEnabled || isMobileBrowser()) {
      return null;
    }

    const url = localizeUrl(ALERTS_URL);
    const isActive = window.location.pathname.includes(url);
    const iconClassName = showDropdownIcon ? 'glyphicon glyphicon-search' : '';

    if (isDropdownOption) {
      return asDropdownOption(
        e => onLinkClicked(url, e),
        TEXT.alerts,
        iconClassName,
      );
    }

    return asButton(e => onLinkClicked(url, e), TEXT.alerts, isActive);
  }

  maybeRenderMoreOptionsDropdown(children = null) {
    const showMoreOptionsDropdown =
      this.state.moreOptionsCount > 0 && children.length > 0;

    if (!showMoreOptionsDropdown || !this.props.isAuthenticated) {
      return null;
    }

    return (
      <div className="navbar__item navbar__item--link navbar__item--link-offset">
        <Dropdown
          hideCaret={false}
          caretType={CARET_TYPES.MENU}
          className="navbar-dropdown more-dropdown-link"
          defaultDisplayContent={TEXT.more}
          displayCurrentSelection={false}
          onSelectionChange={onSelection}
          menuAlignment={Dropdown.Alignments.RIGHT}
          value=""
        >
          {children}
        </Dropdown>
      </div>
    );
  }

  @autobind
  maybeRenderDataQualityLink(isDropdownOption = false) {
    if (
      !this.props.isAuthenticated ||
      !window.__JSON_FROM_BACKEND.ui.enableDataQualityLab ||
      isMobileBrowser()
    ) {
      return null;
    }

    const url = localizeUrl(DATA_QUALITY_URL);
    const isActive = window.location.pathname.includes(url);

    if (isDropdownOption) {
      return asDropdownOption(
        e => onLinkClicked(localizeUrl(DATA_QUALITY_URL), e),
        TEXT.dataQuality,
        '',
        null,
      );
    }

    return asButton(
      e => onLinkClicked(localizeUrl(DATA_QUALITY_URL), e),
      TEXT.dataQuality,
      isActive,
    );
  }

  renderDropdownTitleItem(titleName, value) {
    return (
      <div className="navbar-dropdown-summary__item">
        <div className="navbar-dropdown-summary__title-name">{titleName}</div>
        <div className="navbar-dropdown-summary__title-value">{value}</div>
      </div>
    );
  }

  renderDropdownSummaryTitle() {
    const { userStatus, dataUpdate, versionInfo } = this.getSummaryInfo();

    return (
      <Dropdown.Option
        disableSearch
        key="summary"
        value="__unused__"
        wrapperClassName="navbar-dropdown-summary"
        unselectable
      >
        {userStatus}
        {dataUpdate}
        {versionInfo}
      </Dropdown.Option>
    );
  }

  renderMobileSummaryInfo() {
    const { userStatus, dataUpdate, versionInfo } = this.getSummaryInfo();
    return (
      <div className="navbar__mobile-summary-container">
        {userStatus}
        {dataUpdate}
        {versionInfo}
      </div>
    );
  }

  renderFullNavbar() {
    const { moreOptionsCount } = this.state;
    let leftAlignedLinks = [
      this.maybeRenderAnalyzeLink,
      this.maybeRenderDashboardsDropdown,
      this.maybeRenderDataQualityLink,
      this.maybeRenderCaseManagementLink,
      this.maybeRenderAlertsLink,
    ];

    // filter out render functions that are null for a deployment
    leftAlignedLinks = leftAlignedLinks.filter(f => f());
    let moreDropdownLinks = [];

    if (moreOptionsCount > 0) {
      // ensure that a minimum of 2 links are displayed before the more dropdown
      const leftAlignedLinksCount = Math.max(
        2,
        leftAlignedLinks.length - moreOptionsCount,
      );

      // only add items to more dropdown if more than 1 item exists
      if (leftAlignedLinks.length - leftAlignedLinksCount > 1) {
        moreDropdownLinks = leftAlignedLinks.slice(leftAlignedLinksCount);
        leftAlignedLinks = leftAlignedLinks.slice(0, leftAlignedLinksCount);
      }
    }

    return (
      <React.Fragment>
        <div className="navbar__links--left">
          {leftAlignedLinks.map(renderLink => renderLink())}
          {this.maybeRenderMoreOptionsDropdown(
            moreDropdownLinks.map(renderLink => renderLink(true, false)),
          )}
        </div>
        <div className="navbar__links--right">
          {this.renderNavigationDropdown()}
        </div>
      </React.Fragment>
    );
  }

  renderMobileNavbar() {
    return (
      <React.Fragment>
        <div className="navbar__links--left">
          {this.maybeRenderDashboardsDropdown()}
        </div>
        <div className="navbar__links--right">
          <button
            type="button"
            className="navbar__item navbar__item--link"
            onClick={this.onHamburgerClick}
          >
            <Icon type="menu-hamburger" />
          </button>
        </div>
        {this.maybeRenderDrawer()}
      </React.Fragment>
    );
  }

  // render actual navigation buttons
  renderNavArea() {
    const content = this.renderFullNavbar();
    return <div className="navbar__links">{content}</div>;
  }

  renderMobileNavArea() {
    return <div className="navbar__links">{this.renderMobileNavbar()}</div>;
  }

  renderNavigationDropdown(children = null) {
    const { isAuthenticated, visibleName } = this.props;
    const { ui, locales } = window.__JSON_FROM_BACKEND;
    return (
      <div className="navbar__item navbar__item--link">
        <NavigationDropdown
          isAdmin={this.state.isAdmin}
          isAuthenticated={isAuthenticated}
          showLocales={ui.showLocalePicker}
          locales={locales}
          visibleName={visibleName}
        >
          {this.renderDropdownSummaryTitle()}
          {children}
        </NavigationDropdown>
      </div>
    );
  }

  renderTitleContainer() {
    const { flagClass, logoPath, fullPlatformName } = this.props;
    let platformName = fullPlatformName;

    if (this.state.showAcronym) {
      platformName = extractAcronym(fullPlatformName);
    }

    let logo;
    if (logoPath) {
      logo = <img src={logoPath} alt={platformName} />;
    } else {
      logo = (
        <React.Fragment>
          <span className="navbar__logo">
            <i className={`flag ${flagClass}`} />
          </span>
          <span className="navbar__title">{platformName}</span>
        </React.Fragment>
      );
    }

    return (
      <div
        className="navbar__title-container"
        onClick={this.onHomeClicked}
        role="button"
      >
        {logo}
      </div>
    );
  }

  renderNavbar() {
    return (
      <React.Fragment>
        {this.state.isMobileView
          ? this.renderMobileNavArea()
          : this.renderNavArea()}
        {this.maybeRenderCreateDashboardModal()}
      </React.Fragment>
    );
  }

  render() {
    const className = classNames('navbar', 'hide-in-screenshot', {
      navbar__mobile: this.state.isMobileView,
    });
    return (
      <div className={className}>
        {this.renderTitleContainer()}
        {this.renderNavbar()}
      </div>
    );
  }
}

Navbar.propTypes = propTypes;
Navbar.defaultProps = defaultProps;

export default Navbar;
