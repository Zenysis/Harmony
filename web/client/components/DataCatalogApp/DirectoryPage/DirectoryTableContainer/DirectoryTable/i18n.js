// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_DataCatalogApp_DirectoryPage_DirectoryTableContainer_DirectoryTable_DirectoryRow from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/DirectoryTable/DirectoryRow/i18n';
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
    dataSource: 'Data Source',
    description: 'Description',
    name: 'Name',
    status: 'Status',
    'No resources found': 'No resources found',
    'There are no resources in this folder':
      'There are no resources in this folder',
  },
  am: {},
  fr: {},
  pt: {
    dataSource: 'Fonte de dados',
    description: 'Descrição',
    name: 'Nome',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_DataCatalogApp_DirectoryPage_DirectoryTableContainer_DirectoryTable_DirectoryRow,
]);
export default translations;
