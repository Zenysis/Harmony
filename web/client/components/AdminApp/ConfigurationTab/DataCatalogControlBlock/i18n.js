// @flow

/* eslint-disable */
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
    csvImportSuccess: 'Your fields csv import completed successfully.',
    exportDataCatalog: 'Export data catalog',
    exportMetadata: 'Export metadata',
    import: 'import',
    importCSVFailed: 'Your fields csv import failed.',
    importCatalogPrompt:
      'Importing this new data catalog will overwrite the currently active catalog. In doing so, note that you may overwrite changes not included in the imported data catalog. After completing this action, If an issue arises with the new data catalog, you can re-import the current data catalog (found in your Downloads folder).',
    importDataCatalog: 'Import data catalog',
    importFailed: 'Your data catalog import failed',
    importFieldsPrompt:
      'Importing this new data catalog will add new fields into data catalog that you will be unable to remove. However, you are able to hide these indicators. After completing this action, If an issue arises with the new data catalog, you can re-import the current data catalog (found in your Downloads folder).',
    importNewIndicators: 'Import new indicators',
    importProgress: 'Importing data...',
    'Are you sure you want to import %(csvFileName)s?':
      'Are you sure you want to import %(csvFileName)s?',
    'Are you sure you want to import %(fileName)s?':
      'Are you sure you want to import %(fileName)s?',
    'Click to select file': 'Click to select file',
    'Data catalog': 'Data catalog',
    'Download current data catalog for backup purposes':
      'Download current data catalog for backup purposes',
    'Download dimension IDs, category mappings and data source IDs to be used when creating new indicators':
      'Download dimension IDs, category mappings and data source IDs to be used when creating new indicators',
    "Export this instance's data catalog to be used in other instances":
      "Export this instance's data catalog to be used in other instances",
    'Import a data catalog to replace the active data catalog on this instance':
      'Import a data catalog to replace the active data catalog on this instance',
    'Import confirmation': 'Import confirmation',
    'Import new indicators or update existing indicators defined in the Google Sheet CSV':
      'Import new indicators or update existing indicators defined in the Google Sheet CSV',
    'Select file to import': 'Select file to import',
    'Your data catalog export will download shortly':
      'Your data catalog export will download shortly',
    'Your data catalog import completed successfully':
      'Your data catalog import completed successfully',
    'Your data catalog import might take sometime to complete':
      'Your data catalog import might take sometime to complete',
    'Your data catalog metadata export will download shortly':
      'Your data catalog metadata export will download shortly',
    'Your fields csv import might take sometime to complete':
      'Your fields csv import might take sometime to complete',
    'yes, import': 'yes, import',
  },
  am: {},
  fr: {},
  pt: {
    csvImportSuccess: 'Importação csv concluída com sucesso.',
    import: 'importar',
    'Select file to import': 'Selecione ficheiro para importar',
    'yes, import': 'sim, importar',
  },
};
export default translations;
