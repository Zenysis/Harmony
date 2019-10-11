// @flow
import * as React from 'react';
import classNames from 'classnames';

import Dropdown from 'components/ui/Dropdown';
import { maybeOpenNewTab } from 'util/util';

export type DropdownOptionEventHandler = (
  e: SyntheticEvent<HTMLElement>,
) => void;

// eslint-disable-next-line max-len
export const MOBILE_REGEX = /android|fennec|iemobile|iphone|opera (?:mini|mobi)/i;

// eslint-disable-next-line max-len
export const ALLOWED_MOBILE_PATHS_REGEX = /\/(?:query|dashboard|user|unauthorized|login|zen\/)/i;

const DEFAULT_LOCALE = window.__JSON_FROM_BACKEND.ui.defaultLocale;

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
  e: MouseEvent | Object = {},
  analyticsEvent: any = undefined,
  analyticsProperties: any = undefined,
  openNewTab: boolean = false,
): void {
  const openUrl = () => maybeOpenNewTab(url, e.metaKey || openNewTab);
  if (analyticsEvent === undefined) {
    openUrl();
    return;
  }

  analytics.track(analyticsEvent, analyticsProperties, undefined, openUrl);
}

// NOTE(stephen): This feels kinda hacky. Really wanted to use a normal
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
        <span className="navbar-dropdown__icon">
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
): React.Node {
  const className = classNames('navbar__item', 'navbar__item--link', {
    'navbar__item--active': isActive,
  });
  return (
    <div className={className} key={text}>
      <button type="button" onClick={onClick}>
        {text}
        {children}
      </button>
    </div>
  );
}

export function isMobileBrowser(): boolean {
  const userAgent =
    window.navigator.userAgent || window.navigator.vendor || window.opera;
  return MOBILE_REGEX.test(userAgent);
}

export function isForbiddenPath(url: string) {
  return !ALLOWED_MOBILE_PATHS_REGEX.test(url);
}
