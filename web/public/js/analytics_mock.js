/* eslint-disable no-console */
/* eslint-disable func-names */

window.analytics = {
  init: function() {
    console.log('Mock analytics[init]:', arguments);
  },
  identify: function() {
    console.log('Mock analytics [identify]:', arguments);
  },
  track: function(
    eventName,
    properties,
    options=undefined,
    callbackFunction=undefined,
  ) {
    // NOTE(vedant): Although `options` is not used in this function, it is
    // part of the method signature for the official `track` call. As a result,
    // we do respect the parameter.
    // See: https://segment.com/docs/sources/website/analytics.js/#track
    console.log('Mock analytics [track]:', eventName, properties);
    if (callbackFunction) {
      // Mimicking the behaviour of the actual function signature that
      // the non-mocked segment API uses.
      callbackFunction(false, undefined);
    }
  }
};
