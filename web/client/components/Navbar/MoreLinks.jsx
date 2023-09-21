// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import { ENABLED_DATA_CATALOG_APP } from 'components/DataCatalogApp/flags';
import {
  asDropdownOption,
  asButton,
  localizeUrl,
  onLinkClicked,
} from 'components/Navbar/util';
import type { DropdownOptionEventHandler } from 'components/Navbar/util';

export type Locale = {
  /** The country flag e.g. 🇺🇬 */
  flag: string,

  /** The locale ISO code, e.g. 'en', 'am' */
  id: string,

  /** The locale name e.g. English */
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

  /** Boolean value to determine whether to show Data Catalog link */
  showDataCatalog: boolean,

  /** Boolean value to determine whether to show Data Upload link */
  showDataUpload: boolean,

  /** Boolean value to determine whether to show Indicator Setup link */
  showIndicatorSetup: boolean,

  /** Boolean value to determine whether to show locales or not  */
  showLocales?: boolean,
};

export default function MoreLinks({
  isAuthenticated,
  children = null,
  isAdmin = false,
  showDataUpload = false,
  showDataCatalog = false,
  showIndicatorSetup = false,
  showLocales = false,
  locales = [],
  linksAsDropdownOptions = true,
}: Props): React.Node {
  const maybeRenderAdminOption = React.useMemo(() => {
    if (!isAdmin) {
      return null;
    }
    const onAdminLinkClick = e => onLinkClicked(localizeUrl('/admin'), e);
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
      const onLocaleLinkClick = e => onLinkClicked(locale.url, e);

      const text = locale.label;
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

  const maybeRenderDataStatusOption = React.useMemo(() => {
    if (!isAdmin) {
      return null;
    }
    const onDataStatusLinkClick = e =>
      onLinkClicked(localizeUrl('/data-status'), e);
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

  const maybeRenderGeoMapperOption = React.useMemo(() => {
    return null;
  }, []);

  const maybeRenderDataUploadOption = React.useMemo(() => {
    if (!showDataUpload) {
      return null;
    }

    const onDataUploadLinkClick = e =>
      onLinkClicked(localizeUrl('/data-upload'), e);

    const text = I18N.text('Data Upload');

    return linksAsDropdownOptions
      ? asDropdownOption(
          onDataUploadLinkClick,
          text,
          'glyphicon glyphicon-upload',
        )
      : asButton(onDataUploadLinkClick, text);
  }, [showDataUpload, linksAsDropdownOptions]);

  const maybeRenderDataCatalogOption = React.useMemo(() => {
    if (!ENABLED_DATA_CATALOG_APP || !showDataCatalog) {
      return null;
    }
    const onDataCatalogLinkClick = e =>
      onLinkClicked(localizeUrl('/data-catalog'));
    const text = I18N.text('Data Catalog');
    if (linksAsDropdownOptions) {
      return asDropdownOption(
        onDataCatalogLinkClick,
        text,
        'glyphicon glyphicon-folder-close',
      );
    }
    return asButton(onDataCatalogLinkClick, text);
  }, [showDataCatalog, linksAsDropdownOptions]);

  const maybeRenderDataDigestOption = React.useMemo(() => {
    if (!isAdmin) {
      return null;
    }

    const onDataDigestLinkClick = e =>
      onLinkClicked(localizeUrl('/data-digest'), e);

    const text = I18N.text('Data Digest');

    return linksAsDropdownOptions
      ? asDropdownOption(
          onDataDigestLinkClick,
          text,
          'glyphicon glyphicon-list-alt',
        )
      : asButton(onDataDigestLinkClick, text);
  }, [isAdmin, linksAsDropdownOptions]);

  const maybeRenderIndicatorSetupOption = React.useMemo(() => {
    if (!showIndicatorSetup) {
      return null;
    }
    const onIndicatorSetupClick = e =>
      onLinkClicked(localizeUrl('/indicator-setup'), e);
    const text = I18N.textById('Indicator Setup');
    if (linksAsDropdownOptions) {
      return asDropdownOption(
        onIndicatorSetupClick,
        text,
        'glyphicon glyphicon-folder-close',
      );
    }
    return asButton(onIndicatorSetupClick, text);
  }, [linksAsDropdownOptions, showIndicatorSetup]);

  const renderSignOutOption = React.useCallback(
    (logoutUrl: string, username: string) => {
      const onSignOutLinkClick = e => onLinkClicked(logoutUrl, e);
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
      maybeRenderDataStatusOption,
      maybeRenderDataUploadOption,
      maybeRenderDataDigestOption,
      maybeRenderIndicatorSetupOption,
      maybeRenderLocaleOptions,
      maybeRenderGeoMapperOption,
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

  const unAuthenticatedOptions = [
    renderNonAuthenticatedOptions(loginUrl),
    maybeRenderLocaleOptions,
  ];

  const options = isAuthenticated
    ? renderAuthenticatedOptions()
    : unAuthenticatedOptions;

  if (!children || !linksAsDropdownOptions || typeof children !== 'function') {
    return options;
  }

  // if the links are dropdowns options, we need to pass them to a function
  // that can render them in a dropdown
  // $FlowFixMe[incompatible-call]
  return children(options);
}
