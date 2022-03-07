// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_DataCatalogApp_DirectoryPage_DirectoryTableContainer_DirectoryTable_DirectoryRow_DirectoryRowMenu from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/DirectoryTable/DirectoryRow/DirectoryRowMenu/i18n';
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
    deleteFieldTooltip:
      'Only Formula, Cohort, and Copied indicator types can be deleted. Instead, you can hide the indicator if you do not want users to see it.',
    '%(name)s has been moved to %(categoryName)s':
      '%(name)s has been moved to %(categoryName)s',
    'Group must be empty to be deleted': 'Group must be empty to be deleted',
  },
  am: {},
  fr: {},
  pt: {},
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_DataCatalogApp_DirectoryPage_DirectoryTableContainer_DirectoryTable_DirectoryRow_DirectoryRowMenu,
]);
export default translations;
