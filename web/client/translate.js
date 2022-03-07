const counterpart = require('counterpart');

const I18N = require('./lib/I18N').default;
const am = require('./locales/am');
const en = require('./locales/en');
const fr = require('./locales/fr');
const pt = require('./locales/pt');
const translations = require('./i18n').default;

const LOCALE = window.__JSON_FROM_BACKEND
  ? window.__JSON_FROM_BACKEND.locale || 'en'
  : 'en';

// Always load english for fallback purposes
counterpart.registerTranslations('en', en);
counterpart.setFallbackLocale('en');

switch (LOCALE) {
  case 'am':
    counterpart.registerTranslations('am', am);
    break;
  case 'fr':
    counterpart.registerTranslations('fr', fr);
    break;
  case 'pt':
    counterpart.registerTranslations('pt', pt);
    break;
}
counterpart.setLocale(LOCALE);

// Need to use module.exports to support ProvidePlugin (see Webpack config)
module.exports = counterpart.translate.bind(counterpart);

// register our new translations
I18N.registerTranslations(translations);
