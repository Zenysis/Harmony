// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_DataDigestApp_DatasourceOverview from 'components/DataDigestApp/DatasourceOverview/i18n';
import i18n_components_DataDigestApp_PipelineOverview from 'components/DataDigestApp/PipelineOverview/i18n';
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
    'Delivery Slab': 'Delivery Slab',
    'select datasource': 'select datasource',
  },
  am: {},
  fr: {},
  pt: {},
};

I18N.mergeSupplementalTranslations(translations, [
  i18n_components_DataDigestApp_DatasourceOverview,
  i18n_components_DataDigestApp_PipelineOverview,
]);
export default translations;
