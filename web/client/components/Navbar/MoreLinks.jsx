// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import memoizeOne from 'decorators/memoizeOne';
import {
  asDropdownOption,
  asButton,
  localizeUrl,
  onLinkClicked,
  isMobileBrowser,
} from 'components/Navbar/util';
import type { DropdownOptionEventHandler } from 'components/Navbar/util';

const DATA_UPLOAD_URL = '/upload-data';

export type Locale = {
  /** The locale name, e.g. 'en', 'am' */
  id: string,

  /** The Locale name e.g English */
  label: string,

  /** The country flag e.g 🇺🇬 */
  flag: string,

  /** The localized url  */
  url: string,
};

type Props = {|
  /** Boolean value to determine whether a user is authenticated or not */
  isAuthenticated: boolean,

  /** Boolean value to determine whether a user is an admin or not */
  isAdmin: boolean,

  /** Boolean value to determine whether to show locales or not  */
  showLocales: boolean,

  /** Supported languages and their details */
  locales: $ReadOnlyArray<Locale>,

  /** Its children. */
  children:
    | ((
        options: React.ChildrenArray<
          React.Element<Class<Dropdown.Option<DropdownOptionEventHandler>>>,
        >,
      ) => React.Element<Class<Dropdown<DropdownOptionEventHandler>>>)
    | React.Node,

  /** Boolean value to determine whether to return links as drop down options */
  linksAsDropdownOptions: boolean,
|};

const OPTIONS = {
  NATIONAL_DASHBOARD: 'national-dashboard',
  DATA_STATUS: 'data-status',
  CHANGELOG: 'changelog',
  ADMIN: 'admin',
  SIGN_OUT: 'sign-out',
  SIGN_IN: 'sign-in',
  AQT: 'advanced-query',
};

const TEXT = t('Navbar.NavigationDropdown');

const HEADWAY_URL: string = 'https://headwayapp.co/zenysis-changes';

// TODO(stephen): Use the memoizeOne decorator all over the place here.
export default class MoreLinks extends React.PureComponent<Props> {
  static defaultProps = {
    children: null,
    isAdmin: false,
    showLocales: false,
    locales: [],
    linksAsDropdownOptions: true,
  };

  @memoizeOne
  maybeRenderAdminOption(isAdmin: boolean): React.Node {
    if (!isAdmin || isMobileBrowser()) {
      return null;
    }
    const onAdminLinkClick = e =>
      onLinkClicked(localizeUrl('/admin'), e, 'Admin navigation link clicked');
    const text = TEXT[OPTIONS.ADMIN];

    if (this.props.linksAsDropdownOptions) {
      return asDropdownOption(
        onAdminLinkClick,
        text,
        'glyphicon glyphicon-cog',
      );
    }

    return asButton(onAdminLinkClick, text);
  }

  @memoizeOne
  maybeRenderLocaleOptions(
    showLocales: boolean,
    locales: $ReadOnlyArray<Locale>,
  ): React.Node {
    if (!showLocales) {
      return null;
    }

    return locales.map(
      (locale: Locale): React.Node => {
        const onLocaleLinkClick = e =>
          onLinkClicked(
            locale.url,
            e,
            `Locale ${locale.id} navigation link clicked`,
          );
        const text = `${TEXT.useLocale} ${locale.label}`;

        if (this.props.linksAsDropdownOptions) {
          return asDropdownOption(
            onLocaleLinkClick,
            '',
            `flag flag-${locale.flag}`,
            <span>{text}</span>,
          );
        }
        return asButton(onLocaleLinkClick, text);
      },
    );
  }

  @memoizeOne
  maybeRenderAdvancedQueryToolOption(enableAQT: boolean): React.Node {
    if (!enableAQT || isMobileBrowser()) {
      return null;
    }
    const onAQTLinkClick = e =>
      onLinkClicked(
        localizeUrl(`/${OPTIONS.AQT}`),
        e,
        `${OPTIONS.AQT} navigation link clicked`,
      );
    const text = TEXT[OPTIONS.AQT];

    if (this.props.linksAsDropdownOptions) {
      return asDropdownOption(
        onAQTLinkClick,
        text,
        'glyphicon glyphicon-stats',

        /* TODO (dennis) Remove the beta flag once AQT becomes stable */
        <sup style={{ color: 'red' }}>&nbsp;beta</sup>,
      );
    }
    return asButton(onAQTLinkClick, text);
  }

  maybeRenderUserManualLink(): React.Node {
    const { userManualUrl } = window.__JSON_FROM_BACKEND.ui;
    if (!userManualUrl) {
      return null;
    }
    const onUserManualLinkClick = e =>
      onLinkClicked(userManualUrl, e, 'User manual accessed', {
        nonInteraction: 1,
      });
    const text = TEXT.userManual;
    if (this.props.linksAsDropdownOptions) {
      return asDropdownOption(
        onUserManualLinkClick,
        text,
        'glyphicon glyphicon-book',
      );
    }
    return asButton(onUserManualLinkClick, text);
  }

  maybeRenderDataUploadLink(): React.Node {
    const { dataUploadAppOptions } = window.__JSON_FROM_BACKEND;
    if (
      dataUploadAppOptions === undefined ||
      !dataUploadAppOptions.showInNavbar ||
      isMobileBrowser()
    ) {
      return null;
    }

    const onDataUploadLinkClick = e =>
      onLinkClicked(localizeUrl(DATA_UPLOAD_URL), e);
    const text = TEXT.dataUpload;

    if (this.props.linksAsDropdownOptions) {
      return asDropdownOption(
        onDataUploadLinkClick,
        text,
        'glyphicon glyphicon-folder-open',
      );
    }

    return asButton(onDataUploadLinkClick, text);
  }

  maybeRenderChangelog(): React.Node {
    if (!window.__JSON_FROM_BACKEND.user.isAdmin) {
      return null;
    }

    const onChangelogLinkClick = e =>
      onLinkClicked(HEADWAY_URL, e, undefined, undefined, true);
    const text = TEXT.zenysisUpdates;

    if (this.props.linksAsDropdownOptions) {
      return asDropdownOption(
        onChangelogLinkClick,
        text,
        'glyphicon glyphicon-gift',
      );
    }
    return asButton(onChangelogLinkClick, text);
  }

  @memoizeOne
  maybeRenderDataStatusOption(): React.Node {
    if (isMobileBrowser()) {
      return null;
    }
    const onDataStatusLinkClick = e =>
      onLinkClicked(
        localizeUrl('/data-status'),
        e,
        'Data status navigation link clicked',
      );
    const text = TEXT[OPTIONS.DATA_STATUS];

    if (this.props.linksAsDropdownOptions) {
      return asDropdownOption(
        onDataStatusLinkClick,
        text,
        'glyphicon glyphicon-hdd',
      );
    }
    return asButton(onDataStatusLinkClick, text);
  }

  @memoizeOne
  renderSignOutOption(logoutUrl: string, username: string): React.Node {
    const onSignOutLinkClick = e =>
      onLinkClicked(logoutUrl, e, 'User logged out', { username });
    const text = TEXT[OPTIONS.SIGN_OUT];
    if (this.props.linksAsDropdownOptions) {
      return asDropdownOption(
        onSignOutLinkClick,
        text,
        'glyphicon glyphicon-log-out',
      );
    }
    return asButton(onSignOutLinkClick, text);
  }

  renderAuthenticatedOptions(): React.Node {
    const { isAdmin, showLocales, locales } = this.props;
    const { enableEtSidebarExtras } = window.__JSON_FROM_BACKEND.ui;
    const { logoutUrl, username } = window.__JSON_FROM_BACKEND.user;
    return [
      this.maybeRenderAdminOption(isAdmin),
      this.maybeRenderChangelog(),
      this.maybeRenderUserManualLink(),
      this.maybeRenderAdvancedQueryToolOption(true),
      this.maybeRenderDataStatusOption(),
      this.maybeRenderDataUploadLink(),
      this.maybeRenderLocaleOptions(showLocales, locales),
      this.renderSignOutOption(logoutUrl, username),
    ];
  }

  @memoizeOne
  renderNonAuthenticatedOptions(loginUrl: string): React.Node {
    const wrapper = this.props.linksAsDropdownOptions
      ? asDropdownOption
      : asButton;
    return wrapper(e => onLinkClicked(loginUrl, e), TEXT[OPTIONS.SIGN_IN]);
  }

  render() {
    const { children, isAuthenticated, linksAsDropdownOptions } = this.props;
    const { loginUrl } = window.__JSON_FROM_BACKEND.user;
    const options = isAuthenticated
      ? this.renderAuthenticatedOptions()
      : this.renderNonAuthenticatedOptions(loginUrl);

    if (
      !children ||
      !linksAsDropdownOptions ||
      typeof children !== 'function'
    ) {
      return options;
    }

    // if the links are dropdowns options, we need to pass them to a function
    // that can render them in a dropdown
    // TODO(pablo): refactor this to not use `any`
    return children((options: any));
  }
}
