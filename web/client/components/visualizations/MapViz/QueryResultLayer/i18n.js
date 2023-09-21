// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_visualizations_MapViz_QueryResultLayer_MapTimeline from 'components/visualizations/MapViz/QueryResultLayer/MapTimeline/i18n';
import i18n_components_visualizations_MapViz_QueryResultLayer_SearchBox from 'components/visualizations/MapViz/QueryResultLayer/SearchBox/i18n';
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
    Labels: 'Labels',
  },
  pt: {
    Labels: 'R\xF3tulos',
  },
  vn: {
    Labels: 'Nh\xE3n',
  },
  am: {
    Labels: '\u1235\u12EB\u121C\u12CE\u127D',
  },
  fr: {
    Labels: '\xC9tiquettes',
  },
  br: {
    Labels: 'Rótulos',
  },
};

I18N.mergeSupplementalTranslations(translations, [
  i18n_components_visualizations_MapViz_QueryResultLayer_MapTimeline,
  i18n_components_visualizations_MapViz_QueryResultLayer_SearchBox,
]);
export default translations;
