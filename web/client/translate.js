const counterpart = require('counterpart');
const en = require('./locales/en');

const LOCALE = window.__JSON_FROM_BACKEND.locale;

// Always load english for fallback purposes
counterpart.registerTranslations('en', en);
counterpart.setFallbackLocale('en');

switch (LOCALE) {
  // To register a new locale, enter it as a case here:
  /*
  case 'am':
    counterpart.registerTranslations('am', am);
    break;
  */
}
counterpart.setLocale(LOCALE);

// Need to use module.exports to support ProvidePlugin (see Webpack config)
module.exports = counterpart.translate.bind(counterpart);
