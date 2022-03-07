// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import { ENABLED_DATA_CATALOG_APP } from 'components/DataCatalogApp/flags';
import {
  asDropdownOption,
  asButton,
  isMobileBrowser,
  localizeUrl,
  onLinkClicked,
} from 'components/Navbar/util';
import type { DropdownOptionEventHandler } from 'components/Navbar/util';

export type Locale = {
  /** The country flag e.g 🇺🇬 */
  flag: string,

  /** The locale name, e.g. 'en', 'am' */
  id: string,

  /** The Locale name e.g English */
  label: string,

  /** The localized url  */
  url: string,
};

type Props = {
  children?:
    | ((
        options: React.ChildrenArray<
          React.Element<Class<Dropdown.Option<DropdownOptionEventHandler>>>,
        >,
      ) => React.Element<Class<Dropdown<DropdownOptionEventHandler>>>)
    | React.Node,

  /** Boolean value to determine whether a user is an admin or not */
  isAdmin?: boolean,

  /** Boolean value to determine whether a user is authenticated or not */
  isAuthenticated: boolean,

  /** Boolean value to determine whether to return links as drop down options */
  linksAsDropdownOptions?: boolean,

  /** Supported languages and their details */
  locales?: $ReadOnlyArray<Locale>,

  /** Boolean value to determine whether to show Data Upload link */
  showDataUpload: boolean,

  /** Boolean value to determine whether to show locales or not  */
  showLocales?: boolean,
};

export default function MoreLinks({
  isAuthenticated,
  children = null,
  isAdmin = false,
  showDataUpload = false,
  showLocales = false,
  locales = [],
  linksAsDropdownOptions = true,
}: Props): React.Node {
  const maybeRenderAdminOption = React.useMemo(() => {
    if (!isAdmin) {
      return null;
    }
    const onAdminLinkClick = e =>
      onLinkClicked(localizeUrl('/admin'), e, 'Admin navigation link clicked');
    const text = I18N.text('Admin');

    if (linksAsDropdownOptions) {
      return asDropdownOption(
        onAdminLinkClick,
        text,
        'glyphicon glyphicon-cog',
      );
    }

    return asButton(onAdminLinkClick, text);
  }, [isAdmin, linksAsDropdownOptions]);

  const maybeRenderLocaleOptions = React.useMemo(() => {
    if (!showLocales) {
      return null;
    }

    return locales.map((locale: Locale): React.Node => {
      const onLocaleLinkClick = e =>
        onLinkClicked(
          locale.url,
          e,
          `Locale ${locale.id} navigation link clicked`,
        );

      const text = I18N.text('Use %(language)s', { language: locale.label });
      if (linksAsDropdownOptions) {
        return asDropdownOption(
          onLocaleLinkClick,
          '',
          `flag flag-${locale.flag}`,
          <span>{text}</span>,
        );
      }
      return asButton(onLocaleLinkClick, text);
    });
  }, [linksAsDropdownOptions, locales, showLocales]);

  const maybeRenderUserManualLink = React.useMemo(() => {
    const { userManualUrl } = window.__JSON_FROM_BACKEND.ui;
    if (!userManualUrl) {
      return null;
    }
    const onUserManualLinkClick = e =>
      onLinkClicked(userManualUrl, e, 'User manual accessed', {
        nonInteraction: 1,
      });
    const text = I18N.text('User Manual');
    if (linksAsDropdownOptions) {
      return asDropdownOption(
        onUserManualLinkClick,
        text,
        'glyphicon glyphicon-book',
      );
    }
    return asButton(onUserManualLinkClick, text);
  }, [linksAsDropdownOptions]);

  const maybeRenderRawDataUploadLink = React.useMemo(() => {
    const { dataUploadAppOptions } = window.__JSON_FROM_BACKEND;
    if (
      dataUploadAppOptions === undefined ||
      !dataUploadAppOptions.showInNavbar ||
      isMobileBrowser()
    ) {
      return null;
    }

    const onDataUploadLinkClick = e =>
      onLinkClicked(localizeUrl('/upload-data'), e);
    const text = I18N.text('Upload Data');

    if (linksAsDropdownOptions) {
      return asDropdownOption(
        onDataUploadLinkClick,
        text,
        'glyphicon glyphicon-folder-open',
      );
    }

    return asButton(onDataUploadLinkClick, text);
  }, [linksAsDropdownOptions]);

  const maybeRenderDataStatusOption = React.useMemo(() => {
    if (!isAdmin) {
      return null;
    }
    const onDataStatusLinkClick = e =>
      onLinkClicked(
        localizeUrl('/data-status'),
        e,
        'Data status navigation link clicked',
      );
    const text = I18N.text('Data Status');

    if (linksAsDropdownOptions) {
      return asDropdownOption(
        onDataStatusLinkClick,
        text,
        'glyphicon glyphicon-hdd',
      );
    }
    return asButton(onDataStatusLinkClick, text);
  }, [isAdmin, linksAsDropdownOptions]);

  const maybeRenderGeoMapperOption = () => {
    return null;
  };

  const maybeRenderDataUploadOption = () => {
    return null;
  };

  const maybeRenderDataCatalogOption = React.useMemo(() => {
    // TODO(yitian): Add another permission check here. Can be admin only or
    // permission specific to data managers.
    if (!ENABLED_DATA_CATALOG_APP) {
      return null;
    }
    const onDataCatalogLinkClick = e =>
      onLinkClicked(
        localizeUrl('/data-catalog'),
        e,
        'Data catalog navigation link clicked',
      );
    const text = I18N.text('Data Catalog');
    if (linksAsDropdownOptions) {
      return asDropdownOption(
        onDataCatalogLinkClick,
        text,
        'glyphicon glyphicon-folder-close',
      );
    }
    return asButton(onDataCatalogLinkClick, text);
  }, [linksAsDropdownOptions]);

  const renderSignOutOption = React.useCallback(
    (logoutUrl: string, username: string) => {
      const onSignOutLinkClick = e =>
        onLinkClicked(logoutUrl, e, 'User logged out', { username });
      const text = I18N.text('Sign out');
      if (linksAsDropdownOptions) {
        return asDropdownOption(
          onSignOutLinkClick,
          text,
          'glyphicon glyphicon-log-out',
        );
      }
      return asButton(onSignOutLinkClick, text);
    },
    [linksAsDropdownOptions],
  );

  const renderAuthenticatedOptions = () => {
    const { logoutUrl, username } = window.__JSON_FROM_BACKEND.user;
    return [
      maybeRenderAdminOption,
      maybeRenderDataCatalogOption,
      maybeRenderUserManualLink,
      maybeRenderDataStatusOption,
      maybeRenderDataUploadOption,
      maybeRenderLocaleOptions,
      maybeRenderGeoMapperOption,
      maybeRenderRawDataUploadLink,
      renderSignOutOption(logoutUrl, username),
    ];
  };

  const renderNonAuthenticatedOptions = React.useCallback(
    (loginUrl: string) => {
      const wrapper = linksAsDropdownOptions ? asDropdownOption : asButton;
      return wrapper(e => onLinkClicked(loginUrl, e), I18N.text('Sign in'));
    },
    [linksAsDropdownOptions],
  );

  const { loginUrl } = window.__JSON_FROM_BACKEND.user;
  const options = isAuthenticated
    ? renderAuthenticatedOptions()
    : renderNonAuthenticatedOptions(loginUrl);

  if (!children || !linksAsDropdownOptions || typeof children !== 'function') {
    return options;
  }

  // if the links are dropdowns options, we need to pass them to a function
  // that can render them in a dropdown
  // $FlowFixMe[incompatible-call]
  return children(options);
}
