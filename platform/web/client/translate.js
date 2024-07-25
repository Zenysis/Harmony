const counterpart = require('counterpart');

const I18N = require('./lib/I18N').default;
const translations = require('./i18n').default;

const LOCALE = window.__JSON_FROM_BACKEND
  ? window.__JSON_FROM_BACKEND.locale || 'en'
  : 'en';
counterpart.setLocale(LOCALE);

// Need to use module.exports to support ProvidePlugin (see Webpack config)
module.exports = counterpart.translate.bind(counterpart);

// Register new translations
I18N.registerTranslations(translations);
