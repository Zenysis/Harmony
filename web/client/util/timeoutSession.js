// @flow
import ZenClient from 'util/ZenClient';
import { TIMEOUT_EVENT } from 'services/ui/SessionTimeoutService';
import { removeUnloadHandler } from 'util/util';

let setupReady = false;
const LASTEST_ACTIVITY_TIME_KEY = 'inActiveSessionExpirationTime';
const TIMEOUT_MS = window.__JSON_FROM_BACKEND.ui.sessionTimeout * 1000;
const FIVE_MINUTES_IN_MS = 1000 * 60 * 5;
const { isSessionPersisted } = window.__JSON_FROM_BACKEND.ui;

const CHANNEL_SUPPORTED = typeof window.BroadcastChannel !== 'undefined';
const channel = CHANNEL_SUPPORTED
  ? new BroadcastChannel('timeout-channel')
  : {
      // Stub out unsupported functions.
      postMessage: obj => {}, // eslint-disable-line no-unused-vars
      close: () => {},
      onmessage: evt => undefined, // eslint-disable-line no-unused-vars
    };

function setSessionTimeoutCookieValue() {
  const time = new Date().getTime() + TIMEOUT_MS;
  // Note (solo): we set the in active session expiration time to UTC
  // as Cookies do include a timezone information with the expires header
  const inActiveSessionExpirationTime = new Date(time).toUTCString();
  document.cookie = `${LASTEST_ACTIVITY_TIME_KEY}=${inActiveSessionExpirationTime}; path=/; expires=${inActiveSessionExpirationTime}; SameSite=Lax;`;
}

setSessionTimeoutCookieValue();

function isSessionExpired(): boolean {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${LASTEST_ACTIVITY_TIME_KEY}`));
  return !cookieValue;
}

function checkInactiveSession() {
  if (isSessionExpired()) {
    // timeout the session and log out a user
    ZenClient.post('timeout', {})
      .then(data => {
        const nextEndpoint = document.location.href.replace(
          document.location.origin,
          '',
        );

        const timeoutEvent = new CustomEvent(TIMEOUT_EVENT);
        const nextURL = `/login?timeout=1&next=${nextEndpoint}`;

        if (data.timeout) {
          window.toastr.warning('Your session has expired. Please login again');
          // Stop the beforeunload event from propagating
          // to supress unsaved changes dialog.
          removeUnloadHandler();
          window.dispatchEvent(timeoutEvent);
          channel.postMessage({ isSessionStillActive: false });
          document.location.href = nextURL;
        } else if (!document.location.href.includes('/login')) {
          window.dispatchEvent(timeoutEvent);
          channel.postMessage({ isSessionStillActive: false });
          document.location.href = nextURL;
        }
      })
      // NOTE(stephen): Disabling error handling for now since this method
      // will throw an error if the server is offline and pollute our logs.
      .catch(() => {});
  }
}

function redirecToLogin() {
  const nextEndpoint = document.location.href.replace(
    document.location.origin,
    '',
  );
  const nextURL = `/login?timeout=1&next=${nextEndpoint}`;
  document.location.href = nextURL;
}

function receiveMessage(evt: MessageEvent) {
  // NOTE(solo): Broadcasting doesn't affect the current tab
  if (
    typeof evt.data === 'object' &&
    evt.data !== null &&
    typeof evt.data.isSessionStillActive === 'boolean'
  ) {
    const { isSessionStillActive } = evt.data;
    if (!isSessionStillActive) {
      redirecToLogin();
    }
  }
}

function closeChannel() {
  channel.close();
}

channel.onmessage = receiveMessage;

export function monitorSessionTimeout() {
  const { user } = window.__JSON_FROM_BACKEND;
  if (user.isAuthenticated && !isSessionPersisted && !setupReady) {
    document.addEventListener('click', setSessionTimeoutCookieValue);
    document.addEventListener('mousemove', setSessionTimeoutCookieValue);
    document.addEventListener('keypress', setSessionTimeoutCookieValue);
    document.addEventListener('scroll', setSessionTimeoutCookieValue);
    document.addEventListener('mousedown', setSessionTimeoutCookieValue);
    document.addEventListener('focus', setSessionTimeoutCookieValue);
    document.addEventListener('blur', setSessionTimeoutCookieValue);
    setInterval(checkInactiveSession, FIVE_MINUTES_IN_MS);
    setupReady = true;
  }
}

window.addEventListener('unload', closeChannel);
