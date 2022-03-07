// @flow
import 'url-search-params-polyfill';

export function noop() {}

export function maybeOpenNewTab(url: string, metaKey: boolean) {
  if (metaKey) {
    window.open(url, '_blank');
  } else {
    document.location.assign(url);
  }
}

export const DATE_FORMAT = 'YYYY-MM-DD';

export function scrollWindowTo(scrollPx: number, smooth: boolean = false) {
  window.scroll({
    top: scrollPx,
    behavior: smooth ? 'smooth' : 'auto',
  });
}

let idCounter = 0;
// Generates a uniqueId for this browser session, basically in the same
// way that lodash does
export function uniqueId(): string {
  idCounter += 1;
  return idCounter.toString();
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
// NOTE(all): func can either be a function or a function
// reference { current: func }
export function debounce<T: (...args: $ReadOnlyArray<empty>) => mixed>(
  func: { current: T } | T,
  wait: number,
  immediate?: boolean = false,
): T {
  let timeout;

  // $FlowIssue[incompatible-return] - this is totally fine
  return function debounced(...args) {
    const callback = typeof func === 'function' ? func : func.current;
    const later = () => {
      timeout = null;
      if (!immediate) callback(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) callback(...args);
  };
}

// Generate a UUID4 unique identifier.
export function uuid(): string {
  // Build a 128-bit random number to use as the UUID.
  const arr = new Uint8Array(16);
  window.crypto.getRandomValues(arr);

  // Unpack the random numbers and store as hex strings.
  const pieces = arr.reduce((acc, v, i) => {
    // Unpack an 8-bit number into two 4-bit pieces to convert to hex.
    let top = v >> 4; // eslint-disable-line no-bitwise
    const bottom = v & 0xf; // eslint-disable-line no-bitwise

    // Set the version number. This will set the value at position 13 of the
    // UUID.
    if (i === 6) {
      top = 0x4;
    } else if (i === 8) {
      // Set the variant bits at position 17 of the UUID.
      top = (top & 0x3) | 0x8; // eslint-disable-line no-bitwise
    }

    // Add the UUID's hyphens in the appropriate cadence.
    if (i === 4 || i === 6 || i === 8 || i === 10) {
      acc.push('-');
    }

    acc.push(top.toString(16));
    acc.push(bottom.toString(16));
    return acc;
  }, []);

  return pieces.join('');
}

function unloadHandler(event) {
  // Trigger a confirmation dialog warning about unsaved changes.
  event.preventDefault();

  // NOTE(david): This line shouldn't be needed as the spec only requires
  // event.preventDefault(). We include it as some browsers don't properly
  // implement the spec and IE will use the returnValue for the dialog text.
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
  // eslint-disable-next-line no-param-reassign
  event.returnValue = 'Changes you made may not be saved.';
}

export function registerUnloadHandler() {
  if (!window.__JSON_FROM_BACKEND.IS_TEST) {
    window.addEventListener('beforeunload', unloadHandler);
  }
}

export function removeUnloadHandler() {
  window.removeEventListener('beforeunload', unloadHandler);
}

export function getQueryParam(queryParam: string): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(queryParam);
}

export function localizeUrl(path: string): string {
  const { locale } = window.__JSON_FROM_BACKEND;
  const { defaultLocale } = window.__JSON_FROM_BACKEND.ui;

  if (locale && locale !== defaultLocale) {
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

export const IS_ZENYSIS_USER: boolean =
  window.__JSON_FROM_BACKEND.user &&
  window.__JSON_FROM_BACKEND.user.username &&
  window.__JSON_FROM_BACKEND.user.username.match(/^[\w\-.+]+@zenysis.com$/);
