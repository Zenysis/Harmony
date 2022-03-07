// @flow
import Promise from 'bluebird';

// Allow our promises to be cancelable so that their handlers can be
// cleaned up if a component is unmounted before the promise resolves
// $FlowIssue[incompatible-call] - `warnings` is correct: http://bluebirdjs.com/docs/api/promise.config.html - flow-typed annotations need to be fixed
Promise.config({ cancellation: true, warnings: { wForgottenReturn: false } });

// Manually create <script> elements so that the browser can produce nice
// stack traces for these vendor scripts. This also adds the script to
// Chrome's debugger for inspection (jquery's $.getScript does not).
function loadScript(
  src: string,
  onload: mixed => void,
  onerror: Error => void,
) {
  const scriptElt = document.createElement('script');
  scriptElt.type = 'text/javascript';
  scriptElt.src = src;
  scriptElt.onload = onload;
  scriptElt.onerror = onerror;
  if (document.body) {
    document.body.append(scriptElt);
  }
  return scriptElt;
}

const ScriptLoaderService = {
  /**
   * Fetch a single script and return a Promise tied to the load result.
   *
   * script: VendorScript
   * @return Promise
   */
  fetchScript(script: string): Promise<void> {
    return new Promise((resolve, reject) =>
      loadScript(script, resolve, reject),
    );
  },
};

export default ScriptLoaderService;
