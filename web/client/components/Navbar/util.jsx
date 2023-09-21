// @flow
import * as React from 'react';
import classNames from 'classnames';
import type Promise from 'bluebird';

import DirectoryService from 'services/DirectoryService';
import Dropdown from 'components/ui/Dropdown';
import { API_VERSION } from 'services/APIService';
import { convertIDToURI } from 'services/wip/util';
import { maybeOpenNewTab } from 'util/util';
import type { Locale } from 'components/Navbar/MoreLinks';

export type DropdownOptionEventHandler = (
  e: SyntheticEvent<HTMLElement>,
) => void;

// eslint-disable-next-line max-len
export const MOBILE_REGEX: RegExp = /android|fennec|iemobile|iphone|opera (?:mini|mobi)/i;

// eslint-disable-next-line max-len
export const MOBILE_OPTIMIZED_PATHS_REGEX: RegExp = /\/(?:query|dashboard|user|unauthorized|login|zen\/)/i;

// Set up translations for this module
const DEFAULT_LOCALE = window.__JSON_FROM_BACKEND.ui.defaultLocale;
const LOCALE_LABELS = {
  am: 'አማርኛ (ET) ተጠቀም',
  br: 'Usar Português (BR)',
  en: 'Use English (US)',
  fr: 'Utiliser Français',
  pt: 'Usar Português',
  vn: 'Sử dụng Tiếng Việt',
};

// NOTE: We know that the document body will always be non-null.
// Cast it to a non-null type so that Flow is happy.
const DOCUMENT_BODY = ((document.body: $Cast): HTMLBodyElement);

// The width below which we should switch to the mobile view
// This should correspond to $max-mobile-width in _navbar.scss
const MOBILE_VIEW_WIDTH = 678;

export function isMobileView(): boolean {
  return DOCUMENT_BODY.clientWidth < MOBILE_VIEW_WIDTH;
}

export function localizeUrl(path: string): string {
  const { locale } = window.__JSON_FROM_BACKEND;
  if (locale && locale !== DEFAULT_LOCALE) {
    if (path.startsWith('/')) {
      return `/${locale}${path}`;
    }
    return `/${locale}/${path}`;
  }
  return path;
}

export function onLinkClicked(
  url: string,
  e?:
    | SyntheticMouseEvent<HTMLElement>
    | MouseEvent
    | { metaKey?: boolean, ... } = {},
  openNewTab?: boolean = false,
): void {
  const openUrl = () => maybeOpenNewTab(url, e.metaKey || openNewTab);
  openUrl();
}

// NOTE: This feels kinda hacky. Really wanted to use a normal
// component for this, but Dropdown has a very very strict requirement on its
// children being Option's.
export function asDropdownOption(
  onClick: DropdownOptionEventHandler,
  text: string,
  iconClassName: string = '',
  children: React.Node = null,
): React.Element<Class<Dropdown.Option<DropdownOptionEventHandler>>> {
  return (
    <Dropdown.Option key={text || iconClassName} value={onClick}>
      {iconClassName && (
        <span className="navbar-dropdown-menu__icon">
          <i className={iconClassName} />
        </span>
      )}
      {text}
      {children}
    </Dropdown.Option>
  );
}

export function asButton(
  onClick: EventHandler,
  text: string,
  isActive: boolean = false,
  children: React.Node = null,
  testId: string = '',
  buttonClassName: string = '',
  icon: React.Node | void = undefined, // TODO: Correctly type this
): React.Node {
  const className = classNames('navbar-item', buttonClassName, {
    'navbar-item--active': isActive,
  });

  return (
    <button
      key={text}
      className={className}
      data-testid={testId}
      onClick={onClick}
      type="button"
    >
      {icon || null}
      {text}
      {children}
    </button>
  );
}

export function isMobileBrowser(): boolean {
  const userAgent =
    window.navigator.userAgent || window.navigator.vendor || window.opera;
  return MOBILE_REGEX.test(userAgent);
}

export function isUnoptimizedForMobile(url: string): boolean {
  return !MOBILE_OPTIMIZED_PATHS_REGEX.test(url);
}

export function isUserInGroup(groupName: string): Promise<boolean> {
  const currentUserUri = convertIDToURI(
    window.__JSON_FROM_BACKEND.user.id,
    API_VERSION.V2,
    'user',
  );
  return DirectoryService.getIsUserInGroup(currentUserUri, groupName);
}

export function addLocaleLabel(
  locales: $ReadOnlyArray<Locale>,
): $ReadOnlyArray<Locale> {
  const labeledLocales = [];
  // Add language selection label to each locale object
  if (locales) {
    locales.forEach(locale => {
      const localeCopy = locale;
      localeCopy.label = LOCALE_LABELS[locale.id];
      labeledLocales.push(localeCopy);
    });
  }
  return labeledLocales;
}
