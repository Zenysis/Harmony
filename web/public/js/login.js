(function checkBrowserCompatibility() {
  // Prompts warning message if on unsupported browser.
  var warningText = 'You should use the latest version of Google Chrome, Mozilla Firefox, or Microsoft Edge to avoid potential issues.';
  var isChrome = !!window.chrome;
  var isFirefox = typeof InstallTrigger !== 'undefined';
  var isIE = /* @cc_on! @*/false || !!document.documentMode;
  var isEdge = !isIE && !!window.StyleMedia;
  if (!isChrome && !isFirefox && !isIE && !isEdge) {
    $('.form').prepend('<div class="alert alert-danger">' + warningText + '</div>');
  }
})();
