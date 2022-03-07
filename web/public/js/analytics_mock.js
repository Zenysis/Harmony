/* eslint-disable no-console */
/* eslint-disable func-names */

if (
  window.__JSON_FROM_BACKEND.IS_PRODUCTION &&
  !window.__JSON_FROM_BACKEND.IS_TEST
) {
  // HACK(abby): For RBM, hide all analytics tracking for now. So do not log mock statements.
  // NOTE(nina): Even if we are not tracking anything in RBM, we still want
  // to make sure that any callbacks are still triggered.
  window.analytics = {
    init: function() {},
    identify: function() {},
    track: function(
      eventName,
      properties,
      options = undefined,
      callbackFunction = undefined,
    ) {
      if (callbackFunction) {
        callbackFunction(false, undefined);
      }
    },
    trackLink: function() {},
  };
} else {
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
      options = undefined,
      callbackFunction = undefined,
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
    },
    trackLink: function(element, eventName, properties) {
      element.addEventListener('click', () => {
        this.track(eventName, properties);
      });
    },
  };
}
