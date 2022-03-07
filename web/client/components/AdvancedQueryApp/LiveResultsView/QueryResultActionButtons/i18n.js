// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_AdvancedQueryApp_LiveResultsView_QueryResultActionButtons_ShareQueryModal from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/ShareQueryModal/i18n';
import type { TranslationDictionary } from 'lib/I18N';
/**
 * DO NOT:
 * 1. DO NOT touch the `en` object. AT ALL. This is entirely auto-generated from
 * our code. Do not change the string values. Do not add new keys.
 * 2. DO NOT add new locales manually. These are handled by our internal tools.
 *
 * DO:
 * 1. Update any non-`en` translations. Do not change their keys though.
 * 2. Add new non-`en` translations. But make sure their keys match their
 * English counterpart.
 */

const translations: TranslationDictionary = {
  en: {
    Share: 'Share',
    share: 'Share',
    'Add to dashboard': 'Add to dashboard',
    'Filter Results': 'Filter Results',
  },
  am: {},
  fr: {},
  pt: {
    Share: 'Compartilhar',
    share: 'Compartilhar',
    'Add to dashboard': 'Adicionar ao painel',
    'Filter Results': 'Filtrar Resultados',
  },
};

I18N.mergeSupplementalTranslations(translations, [
  i18n_components_AdvancedQueryApp_LiveResultsView_QueryResultActionButtons_ShareQueryModal,
]);
export default translations;
