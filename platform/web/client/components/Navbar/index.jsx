// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import AuthorizationService from 'services/AuthorizationService';
import CollapsibleLink from 'components/Navbar/CollapsibleLink';
import CreateDashboardModal from 'components/common/CreateDashboardModal';
import DashboardService from 'services/DashboardBuilderApp/DashboardService';
import DashboardsFlyout from 'components/Navbar/DashboardsFlyout';
import DirectoryService from 'services/DirectoryService';
import Dropdown from 'components/ui/Dropdown';
import HypertextLink from 'components/ui/HypertextLink';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import MoreLinks from 'components/Navbar/MoreLinks';
import NavigationDropdown from 'components/Navbar/NavigationDropdown';
import Popover from 'components/ui/Popover';
import {
  ALERTS_PERMISSIONS,
  DASHBOARD_PERMISSIONS,
  RESOURCE_TYPES,
  SITE_PERMISSIONS,
} from 'services/AuthorizationService/registry';
import { NAVBAR_ID } from 'components/Navbar/constants';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import {
  asButton,
  asDropdownOption,
  localizeUrl,
  onLinkClicked,
  isMobileBrowser,
  isUnoptimizedForMobile,
  isMobileView,
  addLocaleLabel,
} from 'components/Navbar/util';
import { autobind } from 'decorators';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';

type DefaultProps = {
  flagClass: string,

  /**
   * A callback that is invoked when the user wants to retrieve a list of all
   * dashboards.
   *
   * @returns {Promise<Zen.Array<DashboardMeta>>} A listing of all the
   *                                             dashboards.
   */
  lastDataUpdate: ?string,
  logoPath: string,
  visibleName: string,
};

type Props = {
  ...DefaultProps,
  fullPlatformName: string,
  isAuthenticated: boolean,
  username: string,
};

type State = {
  areDashboardsLoading: boolean,
  canCreateDashboards: boolean,
  canUploadData: boolean,
  canViewAlertsPage: boolean,
  canViewDataCatalog: boolean,
  canViewDataQuality: boolean,
  canViewIndicatorSetup: boolean,
  canViewQueryForm: boolean,

  dashboards: Zen.Array<DashboardMeta>,
  isAdmin: boolean,
  isMobileView: boolean,
  moreOptionsCount: number,
  openDrawer: boolean,
  showAcronym: boolean,
  showCreateDashboardModal: boolean,
  showDashboardsFlyout: boolean,
  small: boolean,
};

// Mapping from state variable to the permission and resourceType that need to
// be checked with the authorization API.
const STATE_TO_AUTH = {
  canCreateDashboards: {
    permission: DASHBOARD_PERMISSIONS.CREATE,
    resourceType: RESOURCE_TYPES.DASHBOARD,
  },
  canUploadData: {
    permission: SITE_PERMISSIONS.CAN_UPLOAD_DATA,
    resourceType: RESOURCE_TYPES.SITE,
  },
  canViewAlertsPage: {
    permission: ALERTS_PERMISSIONS.CREATE,
    resourceType: RESOURCE_TYPES.ALERT,
  },
  canViewDataCatalog: {
    permission: SITE_PERMISSIONS.CAN_VIEW_DATA_CATALOG,
    resourceType: RESOURCE_TYPES.SITE,
  },
  canViewDataQuality: {
    permission: SITE_PERMISSIONS.VIEW_DATA_QUALITY,
    resourceType: RESOURCE_TYPES.SITE,
  },
  canViewIndicatorSetup: {
    permission: SITE_PERMISSIONS.CAN_VIEW_FIELD_SETUP,
    resourceType: RESOURCE_TYPES.SITE,
  },
  canViewQueryForm: {
    permission: SITE_PERMISSIONS.VIEW_QUERY_FORM,
    resourceType: RESOURCE_TYPES.SITE,
  },
  isAdmin: {
    permission: SITE_PERMISSIONS.VIEW_ADMIN_PAGE,
    resourceType: RESOURCE_TYPES.SITE,
  },
};

const ALERTS_URL = '/alerts';
const DATA_QUALITY_URL = '/data-quality';

// Matches navbar-transition-width in _zen_variables.scss
const TRANSITION_WIDTH = 1250;

// The width to switch from full deployment name to an acronym
const SHOW_ACRONYM_WIDTH = 1296;

// The width to consider putting the last 2 items in the more dropdown
const HIDE_TWO_WIDTH = 1050;

// The width to consider putting the last 3 items in the more dropdown
const HIDE_THREE_WIDTH = 800;

// NOTE: We know that the document body will always be non-null.
// Cast it to a non-null type so that Flow is happy.
const DOCUMENT_BODY = ((document.body: $Cast): HTMLBodyElement);

function onSelection(
  value: (SyntheticEvent<HTMLElement>) => void,
  e: SyntheticEvent<HTMLElement>,
) {
  // The value stored is an onClick event we want to use.
  value(e);
}

function isSmall() {
  return DOCUMENT_BODY.clientWidth < TRANSITION_WIDTH;
}

function showAcronym() {
  return DOCUMENT_BODY.clientWidth < SHOW_ACRONYM_WIDTH;
}

function getMoreOptionsCount() {
  const deviceWidth = DOCUMENT_BODY.clientWidth;

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

export default class Navbar extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    flagClass: '',
    lastDataUpdate: null,
    logoPath: '',
    visibleName: '',
  };

  static renderToDOM(elementId?: string = 'header') {
    const elt: ?HTMLElement = document.getElementById(elementId);
    invariant(elt, `Element ID does not exist: ${elementId}`);

    const { ui, user } = window.__JSON_FROM_BACKEND;
    const { firstName, isAuthenticated, lastName, username } = user;
    const visibleName = firstName || lastName;
    const { flagClass, fullPlatformName, lastDataUpdate, logoPath } = ui;
    ReactDOM.render(
      <Navbar
        flagClass={flagClass}
        fullPlatformName={fullPlatformName}
        isAuthenticated={isAuthenticated}
        lastDataUpdate={lastDataUpdate}
        logoPath={logoPath}
        username={username}
        visibleName={visibleName}
      />,
      elt,
    );
  }

  state: State = {
    areDashboardsLoading: true,
    canCreateDashboards: false,
    canUploadData: false,
    canViewAlertsPage: false,
    canViewDataCatalog: false,
    canViewDataQuality: false,
    canViewIndicatorSetup: false,
    canViewQueryForm: false,
    dashboards: Zen.Array.create(),
    isAdmin: false,
    isMobileView: isMobileView(),
    moreOptionsCount: getMoreOptionsCount(),
    openDrawer: false,
    showAcronym: showAcronym(),
    showCreateDashboardModal: false,
    showDashboardsFlyout: false,
    small: isSmall(),
  };

  _dashboardsButtonRef: $ElementRefObject<'div'> = React.createRef();

  componentDidMount() {
    this.maybeShowMobileOptimizationDisclaimer();
    this.initializeDashboardsAndPermissions();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('online', this.handleOnline);
    // Load toastr after the component mounts so that we do not delay the
    // rendering of the navbar.
    // TODO: It'd be nice to get rid of this preload dependency
    // altogether, but I have a feeling that other uses of toastr around the
    // site will break because they don't check if it is loaded.
    VENDOR_SCRIPTS.toastr.load();

    // NOTE: Do not put any permissions detection code inside this
    // function! Permissions (and configuration) checks require a user to be
    // authenticated. `initializeDashboardsAndPermissions` handles this. Place
    // your permission loading code there.
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('online', this.handleOnline);
  }

  @autobind
  openCreateDashboardModal() {
    this.setState({
      showCreateDashboardModal: true,
      showDashboardsFlyout: false,
    });
  }

  @autobind
  closeCreateDashboardModal() {
    this.setState({ showCreateDashboardModal: false });
  }

  @autobind
  openDashboardsFlyout() {
    this.setState({ showDashboardsFlyout: true });
    this.updateDashboardList();
  }

  @autobind
  closeDashboardsFlyout() {
    this.setState({ showDashboardsFlyout: false });
  }

  maybeShowMobileOptimizationDisclaimer() {
    const path = window.location.pathname;

    if (isMobileBrowser() && isUnoptimizedForMobile(path)) {
      window.toastr.warning(
        I18N.text(
          'This page is not optimized for use on mobile.',
          'notMobileOptimized',
        ),
      );
    }
  }

  @autobind
  handleResize() {
    this.setState({
      isMobileView: isMobileView(),
      moreOptionsCount: getMoreOptionsCount(),
      showAcronym: showAcronym(),
      small: isSmall(),
    });
  }

  initializeDashboardsAndPermissions() {
    // If the user is authenticated or public access is enabled, we can
    // initialize the dashboards and user permissions.
    const { isAuthenticated } = this.props;
    if (isAuthenticated) {
      this.updateDashboardList();
      AuthorizationService.isAuthorizedMulti(
        Object.keys(STATE_TO_AUTH).map(k => STATE_TO_AUTH[k]),
      ).then(authorizations => {
        // NOTE: n^2 loop is ok here because the number of
        // authorization checks we issue is small.
        const newState = {};
        Object.keys(STATE_TO_AUTH).forEach(stateKey => {
          const { permission, resourceType } = STATE_TO_AUTH[stateKey];
          authorizations.some(authorizationResponse => {
            if (
              authorizationResponse.permission === permission &&
              authorizationResponse.resourceType === resourceType
            ) {
              newState[stateKey] = authorizationResponse.authorized;
              return true;
            }
            return false;
          });
        });
        this.setState(newState);
      });
    }
  }

  updateDashboardList() {
    this.setState({ areDashboardsLoading: true });
    DashboardService.getDashboards().then(dashboards => {
      this.setState({
        areDashboardsLoading: false,
        dashboards: Zen.Array.create(dashboards),
      });
    });
  }

  handleOffline() {
    window.toastr.clear();

    // prevent toast from closing based on timeouts
    window.toastr.options.timeOut = 0;
    window.toastr.options.extendedTimeOut = 0;
    window.toastr.options.closeButton = true;
    window.toastr.error(
      I18N.text(
        'There is no Internet connection, please try reconnecting.',
        'offlineError',
      ),
    );
  }

  handleOnline() {
    // restore the defaults. See toastr source code for defaults clarity
    // https://github.com/CodeSeven/toastr/blob/master/toastr.js
    window.toastr.options.timeOut = 5000;
    window.toastr.options.extendedTimeOut = 1000;
    window.toastr.options.closeButton = false;
    window.toastr.clear();
  }

  getSummaryInfo(): {
    dataUpdate: React.Element<'div'> | null,
    userStatus: React.Element<'div'> | null,
    versionInfo: React.Element<'div'> | null,
  } {
    const { isAuthenticated, lastDataUpdate, username } = this.props;
    const userStatus = isAuthenticated
      ? this.renderDropdownTitleItem(I18N.text('Logged in as'), username)
      : null;
    const dataUpdate = lastDataUpdate
      ? this.renderDropdownTitleItem(
          I18N.text('Last data refresh'),
          lastDataUpdate,
        )
      : null;

    const { isAdmin } = window.__JSON_FROM_BACKEND.user;
    const { buildTag } = window.__JSON_FROM_BACKEND;
    const versionInfo =
      isAdmin && buildTag
        ? this.renderDropdownTitleItem(I18N.text('Build version'), buildTag)
        : null;
    return {
      dataUpdate,
      userStatus,
      versionInfo,
    };
  }

  onHomeClicked(e: SyntheticMouseEvent<HTMLDivElement>) {
    onLinkClicked(localizeUrl('/overview'), e);
  }

  @autobind
  onHamburgerClick(e: SyntheticMouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    this.setState(prevState => ({
      openDrawer: !prevState.openDrawer,
    }));
  }

  @autobind
  onUpdateDashboardIsFavorite(dashboard: DashboardMeta, isFavorite: boolean) {
    const newDashboard = dashboard.isFavorite(isFavorite);

    this.setState(
      prevState => {
        const index = prevState.dashboards.findIndex(
          currDashboard => currDashboard.slug() === dashboard.slug(),
        );
        const newDashboards = prevState.dashboards.set(index, newDashboard);

        return { dashboards: newDashboards };
      },
      () => DashboardService.markDashboardAsFavorite(dashboard, isFavorite),
    );
  }

  @autobind
  maybeRenderAnalyzeLink(
    isDropdownOption?: boolean = false,
    showDropdownIcon?: boolean = true,
  ): React.Node {
    const { isAuthenticated } = this.props;
    const { canViewQueryForm } = this.state;
    if (!isAuthenticated || !canViewQueryForm) {
      return null;
    }

    const url = localizeUrl('/advanced-query');
    const isActive = window.location.pathname.includes(url);
    const iconClassName = showDropdownIcon ? 'glyphicon glyphicon-search' : '';

    if (isDropdownOption) {
      return asDropdownOption(
        e => onLinkClicked(url, e),
        I18N.text('Analyze'),
        iconClassName,
      );
    }

    return (
      <HypertextLink
        key="analyze"
        onClick={e => onLinkClicked(url, e)}
        url={url}
      >
        {asButton(() => undefined, I18N.textById('Analyze'), isActive)}
      </HypertextLink>
    );
  }

  maybeRenderCreateDashboardModal(): React.Node {
    if (this.state.showCreateDashboardModal) {
      return (
        <CreateDashboardModal
          onRequestClose={this.closeCreateDashboardModal}
          show={this.state.showCreateDashboardModal}
        />
      );
    }

    return null;
  }

  @autobind
  maybeRenderDashboardsFlyoutButton(): React.Node {
    const {
      areDashboardsLoading,
      canCreateDashboards,
      dashboards,
      showDashboardsFlyout,
    } = this.state;

    if (this.props.isAuthenticated) {
      const isActive = window.location.pathname.includes('/dashboard');

      const className = classNames('dashboards-dropdown-button', {
        'navbar-item--active': isActive,
      });

      return (
        <div
          key="dashboards-dropdown"
          ref={this._dashboardsButtonRef}
          className={className}
        >
          {asButton(
            this.openDashboardsFlyout,
            I18N.textById('Dashboards'),
            false,
            null,
            'navbar-dashboards-flyout-button',
          )}
          <Popover
            anchorElt={this._dashboardsButtonRef.current}
            isOpen={showDashboardsFlyout}
            onRequestClose={this.closeDashboardsFlyout}
            windowEdgeThresholds={{
              bottom: 0,
              left: 0,
              right: 0,
              // Prevents the popover overlaying the navbar on small screens.
              top: 60,
            }}
          >
            <DashboardsFlyout
              activeUsername={DirectoryService.getActiveUsername()}
              canCreateDashboards={canCreateDashboards}
              dashboards={dashboards}
              dashboardsLoaded={!areDashboardsLoading}
              onNewDashboardClick={this.openCreateDashboardModal}
              onUpdateDashboardIsFavorite={this.onUpdateDashboardIsFavorite}
            />
          </Popover>
        </div>
      );
    }
    return null;
  }

  maybeRenderLastDataRefresh(): React.Node {
    const { lastDataUpdate } = this.props;
    if (lastDataUpdate) {
      if (this.state.small) {
        return (
          <p>{`${I18N.textById('Last data refresh')}: ${lastDataUpdate}`}</p>
        );
      }
      return ` | ${I18N.textById('Last data refresh')}: ${lastDataUpdate}`;
    }
    return null;
  }

  maybeRenderLoggedInStatus(): React.Node {
    const { isAuthenticated, username } = this.props;
    if (isAuthenticated) {
      return ` | ${I18N.textById('Logged in as')} ${username}`;
    }
    return null;
  }

  maybeRenderDrawer(): React.Node {
    const { isAuthenticated } = this.props;
    const { locales, ui } = window.__JSON_FROM_BACKEND;
    const {
      canUploadData,
      canViewDataCatalog,
      canViewIndicatorSetup,
      isAdmin,
      openDrawer,
    } = this.state;

    if (!openDrawer) {
      return null;
    }

    return (
      <div className="navbar__menu-container">
        {this.renderMobileSummaryInfo()}
        <div>
          {this.maybeRenderAnalyzeLink()}
          {this.maybeRenderDataQualityLink()}
          {this.maybeRenderAlertsLink()}
        </div>
        <CollapsibleLink
          className="navbar-item__more-links"
          label="More"
          openClassName="navbar-item__more-links--open"
        >
          <MoreLinks
            isAdmin={isAdmin}
            isAuthenticated={isAuthenticated}
            linksAsDropdownOptions={false}
            locales={addLocaleLabel(locales)}
            showDataCatalog={canViewDataCatalog}
            showDataUpload={canUploadData}
            showIndicatorSetup={canViewIndicatorSetup}
            showLocales={ui.showLocalePicker}
          />
        </CollapsibleLink>
      </div>
    );
  }

  @autobind
  maybeRenderAlertsLink(
    isDropdownOption?: boolean = false,
    showDropdownIcon?: boolean = true,
  ): React.Node {
    if (!this.state.canViewAlertsPage) {
      return null;
    }

    const { alertsEnabled } = window.__JSON_FROM_BACKEND;
    if (!alertsEnabled) {
      return null;
    }

    const url = localizeUrl(ALERTS_URL);
    const isActive = window.location.pathname.includes(url);
    const iconClassName = showDropdownIcon ? 'glyphicon glyphicon-search' : '';

    if (isDropdownOption) {
      return asDropdownOption(
        e => onLinkClicked(url, e),
        I18N.textById('Alerts'),
        iconClassName,
      );
    }

    return (
      <HypertextLink
        key="alerts"
        onClick={e => onLinkClicked(url, e)}
        url={url}
      >
        {asButton(() => undefined, I18N.textById('Alerts'), isActive)}
      </HypertextLink>
    );
  }

  maybeRenderMoreOptionsDropdown(
    children: $ReadOnlyArray<?React.Element<
      Class<Dropdown.Option<(SyntheticEvent<HTMLElement>) => void>>,
    >>,
  ): React.Node {
    const showMoreOptionsDropdown =
      this.state.moreOptionsCount > 0 && children.length > 0;

    if (!showMoreOptionsDropdown || !this.props.isAuthenticated) {
      return null;
    }

    return (
      <Dropdown
        buttonClassName="navbar-item"
        caretType={Dropdown.CaretTypes.MENU}
        defaultDisplayContent={I18N.text('More')}
        displayCurrentSelection={false}
        hideCaret={false}
        menuAlignment={Dropdown.Alignments.RIGHT}
        menuClassName="navbar-dropdown-menu navbar-more-links__menu"
        onSelectionChange={onSelection}
        value={undefined}
      >
        {children}
      </Dropdown>
    );
  }

  @autobind
  maybeRenderDataQualityLink(isDropdownOption?: boolean = false): React.Node {
    if (
      !this.state.canViewDataQuality ||
      !this.props.isAuthenticated ||
      !window.__JSON_FROM_BACKEND.ui.enableDataQualityLab
    ) {
      return null;
    }

    const url = localizeUrl(DATA_QUALITY_URL);
    const isActive = window.location.pathname.includes(url);

    if (isDropdownOption) {
      return asDropdownOption(
        e => onLinkClicked(localizeUrl(DATA_QUALITY_URL), e),
        '',
      );
    }

    return (
      <HypertextLink
        key="data-quality"
        onClick={e => onLinkClicked(url, e)}
        url={url}
      >
        {asButton(() => undefined, I18N.text('Data Quality'), isActive)}
      </HypertextLink>
    );
  }

  renderDropdownTitleItem(
    titleName: string,
    value: string,
  ): React.Element<'div'> {
    return (
      <div className="navbar-dropdown-summary__item">
        <div className="navbar-dropdown-summary__title-name">{titleName}</div>
        <div className="navbar-dropdown-summary__title-value">{value}</div>
      </div>
    );
  }

  renderDropdownSummaryTitle(): React.Element<typeof Dropdown.Option> {
    const { dataUpdate, userStatus, versionInfo } = this.getSummaryInfo();

    return (
      <Dropdown.Option
        key="summary"
        className="navbar-dropdown-summary__title"
        disableSearch
        value="__unused__"
        wrapperClassName="navbar-dropdown-summary"
      >
        {userStatus}
        {dataUpdate}
        {versionInfo}
      </Dropdown.Option>
    );
  }

  renderMobileSummaryInfo(): React.Node {
    const { dataUpdate, userStatus, versionInfo } = this.getSummaryInfo();
    return (
      <div className="navbar-mobile-summary-container">
        {userStatus}
        {dataUpdate}
        {versionInfo}
      </div>
    );
  }

  renderFullNavbar(): React.Node {
    const { moreOptionsCount } = this.state;
    let leftAlignedLinks = [
      this.maybeRenderAnalyzeLink,
      this.maybeRenderDashboardsFlyoutButton,
      this.maybeRenderDataQualityLink,
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
        <div className="navbar-items__left">
          {leftAlignedLinks.map(renderLink => renderLink())}
          {this.maybeRenderMoreOptionsDropdown(
            // $FlowFixMe[extra-arg] - this is not a good pattern
            // $FlowFixMe[incompatible-call] - this is not a good pattern
            // $FlowFixMe[incompatible-exact] - this is not a good pattern
            moreDropdownLinks.map(renderLink => renderLink(true, false)),
          )}
        </div>
        <div className="navbar-items__right">
          {this.renderNavigationDropdown()}
        </div>
      </React.Fragment>
    );
  }

  renderMobileNavbar(): React.Node {
    return (
      <React.Fragment>
        <div className="navbar-items__left">
          {this.maybeRenderDashboardsFlyoutButton()}
        </div>
        <div className="navbar-items__right">
          <button
            className="navbar-item"
            onClick={this.onHamburgerClick}
            type="button"
          >
            <Icon type="menu-hamburger" />
          </button>
        </div>
        {this.maybeRenderDrawer()}
      </React.Fragment>
    );
  }

  renderNavigationDropdown(): React.Node {
    const { isAuthenticated, visibleName } = this.props;
    const { locales, ui } = window.__JSON_FROM_BACKEND;

    return (
      <NavigationDropdown
        isAdmin={this.state.isAdmin}
        isAuthenticated={isAuthenticated}
        locales={addLocaleLabel(locales)}
        showDataCatalog={this.state.canViewDataCatalog}
        showDataUpload={this.state.canUploadData}
        showIndicatorSetup={this.state.canViewIndicatorSetup}
        showLocales={ui.showLocalePicker}
        visibleName={visibleName}
      >
        {this.renderDropdownSummaryTitle()}
      </NavigationDropdown>
    );
  }

  renderTitleContainer(): React.Node {
    const { flagClass, fullPlatformName, logoPath } = this.props;
    let platformName = fullPlatformName;

    if (this.state.showAcronym) {
      platformName = extractAcronym(fullPlatformName);
    }

    const logo = logoPath ? (
      <img alt="logo" src={logoPath} />
    ) : (
      <i className={`flag ${flagClass}`} />
    );

    // NOTE: $GatesMalariaDemoHack - Hide platform name from nav bar
    const platformTitle = (
      <span className="navbar-title-container__title">{platformName}</span>
    );

    return (
      <button
        className="navbar-title-container"
        onClick={this.onHomeClicked}
        type="button"
      >
        <span className="navbar-title-container__logo">{logo}</span>
        {platformTitle}
      </button>
    );
  }

  renderNavbar(): React.Node {
    const navbarItems = this.state.isMobileView
      ? this.renderMobileNavbar()
      : this.renderFullNavbar();
    return (
      <React.Fragment>
        <div className="navbar-items">{navbarItems}</div>
        {this.maybeRenderCreateDashboardModal()}
      </React.Fragment>
    );
  }

  render(): React.Node {
    // NOTE: $GatesMalariaDemoHack - change navbar style
    const className = classNames('navbar', 'hide-in-screenshot', {
      'navbar-mobile': this.state.isMobileView,
    });
    return (
      <div className={className} id={NAVBAR_ID}>
        {this.renderTitleContainer()}
        {this.renderNavbar()}
      </div>
    );
  }
}
