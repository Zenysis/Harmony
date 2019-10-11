import ZenClient from 'util/ZenClient';
import { removeUnloadHandler } from 'util/util';

let lastActivityTime = new Date();
let setupReady = false;
const TIMEOUT_MS = window.__JSON_FROM_BACKEND.ui.sessionTimeout * 1000;
const { isSessionPersisted } = window.__JSON_FROM_BACKEND.ui;

const CHANNEL_SUPPORTED = typeof window.BroadcastChannel !== 'undefined';
const channel = CHANNEL_SUPPORTED
  ? new window.BroadcastChannel('timeout-channel')
  : {
      // Stub out unsupported functions.
      postMessage: () => {},
      close: () => {},
    };

let isSessionActive = false;

function resetInactivityCounter() {
  lastActivityTime = new Date();
  channel.postMessage({
    isSessionStillActive: true,
  });
}

function checkInactiveSession() {
  const isSessionExpired = new Date() - lastActivityTime >= TIMEOUT_MS;
  if (isSessionExpired) {
    if (!isSessionActive) {
      // timeout the session and log out a user
      ZenClient.post('timeout', {})
        .then(data => {
          const nextEndpoint = document.location.href.replace(
            document.location.origin,
            '',
          );
          if (data.timeout) {
            window.toastr.warning(
              'Your session has expired. Please login again',
            );
            // Stop the beforeunload event from propagating
            // to supress unsaved changes dialog.
            removeUnloadHandler();

            // reset timer and redirect to the login
            lastActivityTime = new Date();
            channel.postMessage({
              isSessionStillActive: false,
            });
            document.location.href = `/login?timeout=1&next=${nextEndpoint}`;
          } else if (!document.location.href.includes('/login')) {
            document.location.href = `/login?timeout=1&next=${nextEndpoint}`;
          }
        })
        // NOTE(stephen): Disabling error handling for now since this method
        // will throw an error if the server is offline and pollute our logs.
        .catch(() => {});
    } else {
      channel.postMessage({
        isSessionStillActive: false,
      });
    }
  }
}

function receiveMessage(evt) {
  // NOTE(solo): Broadcasting doesn't affect the current tab
  const { isSessionStillActive } = evt.data;
  isSessionActive = isSessionStillActive;

  if (!isSessionActive) {
    checkInactiveSession();
  }
}

function closeChannel() {
  channel.close();
}

channel.onmessage = receiveMessage;

export function monitorSessionTimeout() {
  const { user } = window.__JSON_FROM_BACKEND;
  if (user.isAuthenticated && !isSessionPersisted && !setupReady) {
    document.onclick = resetInactivityCounter;
    document.onmousemove = resetInactivityCounter;
    document.onkeypress = resetInactivityCounter;
    document.onscroll = resetInactivityCounter;
    document.onmousedown = resetInactivityCounter;
    document.onfocus = resetInactivityCounter;
    document.onblur = resetInactivityCounter;
    window.setInterval(checkInactiveSession, 1000 * 60 * 5);
    setupReady = true;
  }
}

window.addEventListener('unload', closeChannel);
