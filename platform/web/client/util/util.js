// @flow
import 'url-search-params-polyfill';

import * as Zen from 'lib/Zen';
import I18N from 'lib/I18N';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

export function noop() {}

export function maybeOpenNewTab(url: string, metaKey: boolean) {
  if (metaKey) {
    window.open(url, '_blank');
  } else {
    document.location.assign(url);
  }
}

/**
 * Function to extract a date filter value from a QueryFilterItem array.
 * NOTE: Casting to `any` here because the CustomDateFilterValueItem is
 * not compatible with some other types in the QueryFilterItemMap.
 */
export function getDateFilterValue(
  itemsZenArray: Zen.Array<QueryFilterItem>,
): string {
  const dateFilter = (itemsZenArray.first(): any);
  const dateFilterValue = dateFilter
    ? dateFilter.displayValue()
    : I18N.text('No date filter');
  return `<date-filter>${dateFilterValue}</date-filter>`;
}

export const DATE_FILTER_REGEX: RegExp = /{Date}/g;

export const DATE_FILTER_REPLACE_REGEX: RegExp = /<date-filter>(.*?)\/date-filter>/g;

export const DATE_FORMAT = 'YYYY-MM-DD';

export function scrollWindowTo(scrollPx: number, smooth: boolean = false) {
  window.scroll({
    behavior: smooth ? 'smooth' : 'auto',
    top: scrollPx,
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
// NOTE: func can either be a function or a function
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

  // NOTE: This line shouldn't be needed as the spec only requires
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
  openNewTab: boolean = false,
): void {
  const openUrl = () => maybeOpenNewTab(url, e.metaKey || openNewTab);
  openUrl();
}

/**
 * Trigger a file download. This function supports two approaches:
 *    - The file is provided in a blob with a file name.
 *    - An api endpoint will trigger the file download.
 */
export function downloadFile(
  params: { dataBlob: Blob, fileName: string } | { endpoint: string },
): void {
  // Either create the url for the data blob or else use the endpoint url.
  const url = params.dataBlob
    ? window.URL.createObjectURL(params.dataBlob)
    : params.endpoint;

  // Construct the link element
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  if (params.fileName) {
    a.download = params.fileName;
  }

  // Add the link to the page and click it
  const documentBody = document.body;
  if (documentBody) {
    documentBody.appendChild(a);
    a.click();
    documentBody.removeChild(a);
  }

  // Clean up the object url if it was used.
  if (params.dataBlob) {
    window.URL.revokeObjectURL(url);
  }
}

/**
 * handleAuthRedirect function handles the redirection of the user after login or registration.
 * It gets the 'next' query parameter from the current URL.
 * If 'next' is present and its origin matches the current window's origin, it redirects to the 'next' URL.
 * If 'next' is present but its origin does not match the current window's origin, it redirects to the '/overview' page.
 * If 'next' is not present, it also redirects to the '/overview' page.
 */
export function handleAuthRedirect() {
  const next = getQueryParam('next'); // get the 'next' parameter

  if (next) {
    const nextUrl = new URL(next, window.location.href);
    if (nextUrl.origin === window.location.origin) {
      // Only navigate to the 'next' URL if it's on the same origin
      window.location.href = next;
    } else {
      // If the 'next' URL is not from your domain, redirect to a default location
      window.location.href = '/overview';
    }
  } else {
    window.location.href = '/overview';
  }
}
