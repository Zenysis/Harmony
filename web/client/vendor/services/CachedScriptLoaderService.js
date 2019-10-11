import Promise from 'bluebird';

import ScriptLoaderService from 'vendor/services/ScriptLoaderService';

// Build set of all script URLs loaded on the page
function getInitialLoadedScripts() {
  const output = new Set();
  const regex = /src="(.+?)"/;

  // Can't use forEach here because we're dealing with an HTMLCollection
  for (let i = 0; i < document.scripts.length; i++) {
    const scriptElt = document.scripts.item(i);
    if (scriptElt.src) {
      // Capture both the resolved source url and
      // the requested url contained in the tag
      const requested = scriptElt.outerHTML.match(regex)[1];
      const resolved = scriptElt.src;
      output.add(requested);
      output.add(resolved);
    }
  }
  return output;
}

// Keep track of the promises created for fetching scripts so that we only load
// a given vendor script once. Once a script has been loaded, a resolved promise
// will be stored here, and subsequent requests will return immediately.
const SCRIPT_PROMISES = {};

// Store resolved promises for scripts we know have been fetched and loaded.
getInitialLoadedScripts().forEach((s) => {
  SCRIPT_PROMISES[s] = Promise.resolve();
});

const CachedScriptLoaderService = {
  /**
   * Fetch a single script and return a Promise. If the script has already been
   * successfully retrieved, return a resolved promise.
   *
   * script: VendorScript
   * @return Promise
   */
  fetchScript(script) {
    // Check if this script has already been retrieved.
    if (!SCRIPT_PROMISES[script]) {
      SCRIPT_PROMISES[script] = ScriptLoaderService.fetchScript(script).catch(
        () => delete SCRIPT_PROMISES[script],
      );
    }
    return SCRIPT_PROMISES[script];
  },
};

export default CachedScriptLoaderService;
