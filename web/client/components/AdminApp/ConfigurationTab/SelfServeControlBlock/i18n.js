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
    exportMetadata: 'Export metadata',
    exportSelfServe: 'Export self serve setup',
    importCSVFailed: 'Your fields csv import failed.',
    importFailed: 'Your self serve setup import failed',
    importFieldsPrompt:
      'Importing this file will add new fields into data catalog that you will be unable to remove. However, you are able to hide these indicators. After completing this action, if an issue arises with the new self serve setup, you can re-import the current self serve setup (found in your Downloads folder).',
    importNewIndicators: 'Import new indicators',
    importProgress: 'Importing data...',
    importSelfServe: 'Import self serve setup',
    importSetupPrompt:
      'Importing this new self serve setup will overwrite the currently active data catalog and data upload sources. In doing so, note that you may overwrite changes not included in the imported setup. After completing this action, if an issue arises with the new self serve setup, you can re-import the current self serve setup (found in your Downloads folder).',
    '%(fileName)s Passes Validation': '%(fileName)s Passes Validation',
    '%(fileName)s contains potential conflicts':
      '%(fileName)s contains potential conflicts',
    'Are you sure you want to import %(csvFileName)s?':
      'Are you sure you want to import %(csvFileName)s?',
    'Are you sure you want to import %(fileName)s?':
      'Are you sure you want to import %(fileName)s?',
    'Complete Upload': 'Complete Upload',
    'Download current self serve setup for backup purposes':
      'Download current self serve setup for backup purposes',
    'Download dimension IDs, category mappings and data source IDs to be used when creating new indicators':
      'Download dimension IDs, category mappings and data source IDs to be used when creating new indicators',
    "Export this instance's self serve setup to be used in other instances":
      "Export this instance's self serve setup to be used in other instances",
    'Import a self serve setup to replace the active one on this instance':
      'Import a self serve setup to replace the active one on this instance',
    'Import a self serve setup to replace the active one on this instance_ You can export this setup in the Admin App in the Site Configuration tab_ This setup will replace the existing metadata in this instance for the following records: Field, Field Category, Dimension, Dimension Category, and Datasource_':
      'Import a self serve setup to replace the active one on this instance. You can export this setup in the Admin App in the Site Configuration tab. This setup will replace the existing metadata in this instance for the following records: Field, Field Category, Dimension, Dimension Category, and Datasource.',
    'Import confirmation': 'Import confirmation',
    'Import new indicators or update existing indicators defined in the Google Sheet CSV':
      'Import new indicators or update existing indicators defined in the Google Sheet CSV',
    'Looks like the upload failed': 'Looks like the upload failed',
    'Select file to import': 'Select file to import',
    'Self Serve': 'Self Serve',
    'Your data catalog conflicts summary file will download shortly':
      'Your data catalog conflicts summary file will download shortly',
    'Your data catalog metadata export will download shortly':
      'Your data catalog metadata export will download shortly',
    'Your fields csv import might take some time to complete':
      'Your fields csv import might take some time to complete',
    'Your self serve setup export will download shortly':
      'Your self serve setup export will download shortly',
    'Your self serve setup import completed successfully':
      'Your self serve setup import completed successfully',
    'Your self serve setup import might take some time to complete':
      'Your self serve setup import might take some time to complete',
    'yes, import': 'yes, import',
  },
  pt: {
    csvImportSuccess: 'Importa\xE7\xE3o csv conclu\xEDda com sucesso.',
    exportMetadata: 'Exportar metadados',
    exportSelfServe:
      'Configura\xE7\xE3o de auto-atendimento para exporta\xE7\xE3o',
    importCSVFailed: 'Seus campos de importa\xE7\xE3o csv falharam.',
    importFailed: 'Sua importa\xE7\xE3o de autom\xE1tica falhou.',
    importFieldsPrompt:
      'A importa\xE7\xE3o deste arquivo adicionar\xE1 novos campos ao cat\xE1logo de dados que voc\xEA n\xE3o poder\xE1 remover. No entanto, voc\xEA \xE9 capaz de ocultar estes indicadores. Ap\xF3s completar esta a\xE7\xE3o, se surgir um problema com a nova configura\xE7\xE3o de auto-atendimento, voc\xEA poder\xE1 reimportar a configura\xE7\xE3o atual de auto-atendimento (encontrada em sua pasta Downloads).',
    importNewIndicators: 'Importar novos indicadores',
    importProgress: 'Importa\xE7\xE3o de dados...',
    importSelfServe: 'Configura\xE7\xE3o de importa\xE7\xE3o autom\xE1tica',
    importSetupPrompt:
      'A importa\xE7\xE3o desta nova configura\xE7\xE3o de auto-atendimento sobregravar\xE1 o cat\xE1logo de dados atualmente ativo e as fontes de carregamento de dados. Ao fazer isso, observe que voc\xEA pode sobrescrever as mudan\xE7as n\xE3o inclu\xEDdas na configura\xE7\xE3o importada. Ap\xF3s completar esta a\xE7\xE3o, se surgir um problema com a nova configura\xE7\xE3o de autoatendimento, voc\xEA poder\xE1 reimportar a configura\xE7\xE3o atual de autoatendimento (encontrada em sua pasta Downloads).',
    'Are you sure you want to import %(csvFileName)s?':
      'Voc\xEA tem certeza de que quer importar %(csvFileName)s?',
    'Are you sure you want to import %(fileName)s?':
      'Voc\xEA tem certeza de que quer importar %(fileName)s?',
    'Complete Upload': 'Carregamento completo',
    'Download current self serve setup for backup purposes':
      'Download da configura\xE7\xE3o atual de auto-atendimento para fins de backup',
    'Download dimension IDs, category mappings and data source IDs to be used when creating new indicators':
      'Download de IDs de dimens\xF5es, mapeamentos de categorias e IDs de fontes de dados a serem usados na cria\xE7\xE3o de novos indicadores',
    "Export this instance's self serve setup to be used in other instances":
      'Exportar a configura\xE7\xE3o de auto-atendimento desta inst\xE2ncia para ser usada em outras inst\xE2ncias',
    'Import a self serve setup to replace the active one on this instance':
      'Importar uma configura\xE7\xE3o de auto-atendimento para substituir a ativa neste caso',
    'Import confirmation': 'Confirma\xE7\xE3o de importa\xE7\xE3o',
    'Import new indicators or update existing indicators defined in the Google Sheet CSV':
      'Importar novos indicadores ou atualizar indicadores existentes definidos no Google Sheet CSV',
    'Self Serve': 'Auto-servi\xE7o',
    'Your data catalog metadata export will download shortly':
      'Sua exporta\xE7\xE3o de metadados do cat\xE1logo de dados ser\xE1 baixada em breve',
    'Your fields csv import might take some time to complete':
      'Seus campos de importa\xE7\xE3o csv podem levar algum tempo para serem completados',
    'Your self serve setup export will download shortly':
      'Seu auto-servi\xE7o de configura\xE7\xE3o de exporta\xE7\xE3o ser\xE1 baixado em breve',
    'Your self serve setup import completed successfully':
      'Sua importa\xE7\xE3o de auto-atendimento conclu\xEDda com sucesso',
    'Your self serve setup import might take some time to complete':
      'Sua importa\xE7\xE3o de auto-atendimento pode levar algum tempo para ser conclu\xEDda.',
    'yes, import': 'sim, importar',
  },
  vn: {
    csvImportSuccess:
      'Nh\u1EADp csv c\xE1c tr\u01B0\u1EDDng c\u1EE7a b\u1EA1n \u0111\xE3 ho\xE0n t\u1EA5t th\xE0nh c\xF4ng.',
    exportMetadata: 'Xu\u1EA5t si\xEAu d\u1EEF li\u1EC7u',
    exportSelfServe: 'Xu\u1EA5t thi\u1EBFt l\u1EADp t\u1EF1 ph\u1EE5c v\u1EE5',
    importCSVFailed:
      'Nh\u1EADp csv c\xE1c tr\u01B0\u1EDDng c\u1EE7a b\u1EA1n kh\xF4ng th\xE0nh c\xF4ng.',
    importFailed:
      'Nh\u1EADp thi\u1EBFt l\u1EADp t\u1EF1 ph\u1EE5c v\u1EE5 c\u1EE7a b\u1EA1n kh\xF4ng th\xE0nh c\xF4ng',
    importFieldsPrompt:
      'Nh\u1EADp t\u1EC7p n\xE0y s\u1EBD th\xEAm c\xE1c tr\u01B0\u1EDDng m\u1EDBi v\xE0o danh m\u1EE5c d\u1EEF li\u1EC7u m\xE0 b\u1EA1n s\u1EBD kh\xF4ng th\u1EC3 x\xF3a. Tuy nhi\xEAn, b\u1EA1n c\xF3 th\u1EC3 \u1EA9n c\xE1c ch\u1EC9 s\u1ED1 n\xE0y. Sau khi ho\xE0n th\xE0nh h\xE0nh \u0111\u1ED9ng n\xE0y, n\u1EBFu s\u1EF1 c\u1ED1 ph\xE1t sinh v\u1EDBi thi\u1EBFt l\u1EADp t\u1EF1 ph\u1EE5c v\u1EE5 m\u1EDBi, b\u1EA1n c\xF3 th\u1EC3 nh\u1EADp l\u1EA1i thi\u1EBFt l\u1EADp t\u1EF1 ph\u1EE5c v\u1EE5 hi\u1EC7n t\u1EA1i (c\xF3 trong th\u01B0 m\u1EE5c T\u1EA3i xu\u1ED1ng c\u1EE7a b\u1EA1n).',
    importNewIndicators: 'Nh\u1EADp c\xE1c ch\u1EC9 s\u1ED1 m\u1EDBi',
    importProgress: '\u0110ang nh\u1EADp d\u1EEF li\u1EC7u ...',
    importSelfServe: 'Nh\u1EADp thi\u1EBFt l\u1EADp t\u1EF1 ph\u1EE5c v\u1EE5',
    importSetupPrompt:
      'Vi\u1EC7c nh\u1EADp thi\u1EBFt l\u1EADp t\u1EF1 ph\u1EE5c v\u1EE5 m\u1EDBi n\xE0y s\u1EBD ghi \u0111\xE8 l\xEAn danh m\u1EE5c d\u1EEF li\u1EC7u hi\u1EC7n \u0111ang ho\u1EA1t \u0111\u1ED9ng v\xE0 c\xE1c ngu\u1ED3n t\u1EA3i l\xEAn d\u1EEF li\u1EC7u. Khi l\xE0m nh\u01B0 v\u1EADy, h\xE3y l\u01B0u \xFD r\u1EB1ng b\u1EA1n c\xF3 th\u1EC3 ghi \u0111\xE8 c\xE1c thay \u0111\u1ED5i kh\xF4ng c\xF3 trong thi\u1EBFt l\u1EADp \u0111\xE3 nh\u1EADp. Sau khi ho\xE0n th\xE0nh h\xE0nh \u0111\u1ED9ng n\xE0y, n\u1EBFu s\u1EF1 c\u1ED1 ph\xE1t sinh v\u1EDBi thi\u1EBFt l\u1EADp t\u1EF1 ph\u1EE5c v\u1EE5 m\u1EDBi, b\u1EA1n c\xF3 th\u1EC3 nh\u1EADp l\u1EA1i thi\u1EBFt l\u1EADp t\u1EF1 ph\u1EE5c v\u1EE5 hi\u1EC7n t\u1EA1i (c\xF3 trong th\u01B0 m\u1EE5c T\u1EA3i xu\u1ED1ng c\u1EE7a b\u1EA1n).',
    'Are you sure you want to import %(csvFileName)s?':
      'B\u1EA1n c\xF3 ch\u1EAFc ch\u1EAFn mu\u1ED1n nh\u1EADp %(csvFileName)s kh\xF4ng?',
    'Are you sure you want to import %(fileName)s?':
      'B\u1EA1n c\xF3 ch\u1EAFc ch\u1EAFn mu\u1ED1n nh\u1EADp %(fileName)s kh\xF4ng?',
    'Complete Upload': 'Ho\xE0n th\xE0nh t\u1EA3i l\xEAn',
    'Download current self serve setup for backup purposes':
      'T\u1EA3i xu\u1ED1ng thi\u1EBFt l\u1EADp t\u1EF1 ph\u1EE5c v\u1EE5 hi\u1EC7n t\u1EA1i cho m\u1EE5c \u0111\xEDch sao l\u01B0u',
    'Download dimension IDs, category mappings and data source IDs to be used when creating new indicators':
      'T\u1EA3i xu\u1ED1ng ID th\u1EE9 nguy\xEAn, danh m\u1EE5c b\u1EA3n \u0111\u1ED3 v\xE0 ID ngu\u1ED3n d\u1EEF li\u1EC7u s\u1EBD \u0111\u01B0\u1EE3c s\u1EED d\u1EE5ng khi t\u1EA1o ch\u1EC9 s\u1ED1 m\u1EDBi',
    "Export this instance's self serve setup to be used in other instances":
      'Xu\u1EA5t thi\u1EBFt l\u1EADp t\u1EF1 ph\u1EE5c v\u1EE5 c\u1EE7a phi\xEAn b\u1EA3n n\xE0y \u0111\u1EC3 \u0111\u01B0\u1EE3c s\u1EED d\u1EE5ng trong c\xE1c phi\xEAn b\u1EA3n kh\xE1c',
    'Import a self serve setup to replace the active one on this instance':
      'Nh\u1EADp thi\u1EBFt l\u1EADp t\u1EF1 ph\u1EE5c v\u1EE5 \u0111\u1EC3 thay th\u1EBF thi\u1EBFt l\u1EADp \u0111ang ho\u1EA1t \u0111\u1ED9ng tr\xEAn phi\xEAn b\u1EA3n n\xE0y',
    'Import confirmation': 'X\xE1c nh\u1EADn nh\u1EADp d\u1EEF li\u1EC7u',
    'Import new indicators or update existing indicators defined in the Google Sheet CSV':
      'Nh\u1EADp c\xE1c ch\u1EC9 s\u1ED1 m\u1EDBi ho\u1EB7c c\u1EADp nh\u1EADt c\xE1c ch\u1EC9 s\u1ED1 hi\u1EC7n c\xF3 \u0111\u01B0\u1EE3c x\xE1c \u0111\u1ECBnh trong Trang t\xEDnh Google CSV',
    'Self Serve': 'T\u1EF1 ph\u1EE5c v\u1EE5',
    'Your data catalog metadata export will download shortly':
      'Qu\xE1 tr\xECnh xu\u1EA5t si\xEAu d\u1EEF li\u1EC7u danh m\u1EE5c d\u1EEF li\u1EC7u c\u1EE7a b\u1EA1n s\u1EBD s\u1EDBm \u0111\u01B0\u1EE3c t\u1EA3i xu\u1ED1ng',
    'Your fields csv import might take some time to complete':
      'Qu\xE1 tr\xECnh nh\u1EADp csv c\xE1c tr\u01B0\u1EDDng c\u1EE7a b\u1EA1n c\xF3 th\u1EC3 m\u1EA5t m\u1ED9t ch\xFAt th\u1EDDi gian \u0111\u1EC3 ho\xE0n th\xE0nh',
    'Your self serve setup export will download shortly':
      'Qu\xE1 tr\xECnh xu\u1EA5t thi\u1EBFt l\u1EADp t\u1EF1 ph\u1EE5c v\u1EE5 c\u1EE7a b\u1EA1n s\u1EBD s\u1EDBm \u0111\u01B0\u1EE3c t\u1EA3i xu\u1ED1ng',
    'Your self serve setup import completed successfully':
      'Qu\xE1 tr\xECnh nh\u1EADp thi\u1EBFt l\u1EADp t\u1EF1 ph\u1EE5c v\u1EE5 c\u1EE7a b\u1EA1n \u0111\xE3 ho\xE0n t\u1EA5t th\xE0nh c\xF4ng',
    'Your self serve setup import might take some time to complete':
      'Qu\xE1 tr\xECnh nh\u1EADp thi\u1EBFt l\u1EADp t\u1EF1 ph\u1EE5c v\u1EE5 c\u1EE7a b\u1EA1n c\xF3 th\u1EC3 m\u1EA5t m\u1ED9t ch\xFAt th\u1EDDi gian \u0111\u1EC3 ho\xE0n th\xE0nh',
    'yes, import': 'v\xE2ng, nh\u1EADp kh\u1EA9u',
  },
  am: {
    csvImportSuccess:
      'csv \u1260\u1270\u1233\u12AB \u1201\u1294\u1273 \u12C8\u12F0 \u1235\u122D\u12D3\u1271 \u1308\u1265\u1276 \u1270\u1320\u1293\u124B\u120D',
    exportMetadata: '\u121C\u1273\u12F3\u1273 \u120B\u12AD',
    exportSelfServe:
      '\u12E8\u122B\u1235 \u12A0\u1308\u120D\u130B\u12ED \u121B\u12CB\u1240\u122D\u1295 \u12C8\u12F0 \u12CD\u132D \u120B\u12AD',
    importCSVFailed:
      'csv \u121B\u1235\u1218\u1323\u1275 \u12A0\u120D\u1270\u1233\u12AB\u121D',
    importFailed:
      '\u12E8\u12F3\u1273 \u12AB\u1273\u120E\u130D\u1205 \u121B\u1235\u1218\u1323\u1275 \u12A0\u120D\u1270\u1233\u12AB\u121D\u1362',
    importFieldsPrompt:
      '\u12ED\u1205\u1295 \u12A0\u12F2\u1235 \u12E8\u1218\u1228\u1303 \u12AB\u1273\u120E\u130D \u121B\u1235\u1308\u1263\u1275 \u120A\u12EB\u1235\u12C8\u130D\u12F7\u1278\u12CD \u12E8\u121B\u12ED\u127D\u120F\u1278\u12CD \u12E8\u1218\u1228\u1303 \u1218\u1235\u12AE\u127D \u12EB\u12AD\u120B\u120D\u1362 \u1206\u1296\u121D \u1363 \u12A5\u1290\u12DA\u1205\u1295 \u12A0\u1218\u120D\u12AB\u127E\u127D \u1218\u12F0\u1260\u1245 \u12ED\u127D\u120B\u1209\u1362 \u12ED\u1205\u1295\u1295 \u12A5\u122D\u121D\u1303 \u12A8\u1328\u1228\u1231 \u1260\u128B\u120B \u1260\u12A0\u12F2\u1231 \u12E8\u12CD\u1202\u1265 \u12AB\u1273\u120E\u130D \u120B\u12ED \u12A0\u1295\u12F5 \u127D\u130D\u122D \u12A8\u1270\u1290\u1233 \u12E8\u12A0\u1201\u1291\u1295 \u12E8\u12CD\u1202\u1265 \u12AB\u1273\u120E\u130D (\u1260Downloads \u12A0\u1243\u134A\u12CE \u12CD\u1235\u1325 \u12ED\u1308\u129B\u120D) \u12A5\u1295\u12F0\u1308\u1293 \u121B\u1235\u1218\u1323\u1275 \u12ED\u127D\u120B\u1209\u1362',
    importNewIndicators:
      '\u12A0\u12F2\u1235 \u12A0\u1218\u120D\u12AB\u127E\u127D\u1295 \u12EB\u1235\u1308\u1261',
    importProgress:
      '\u1218\u1228\u1303\u1295 \u1260\u121B\u1235\u1308\u1263\u1275 \u120B\u12ED...',
    importSelfServe:
      '\u12E8\u122B\u1235 \u12A0\u1308\u120D\u130B\u12ED \u121B\u12CB\u1240\u122D\u1295 \u12A0\u1235\u1218\u1323',
    importSetupPrompt:
      '\u12ED\u1205\u1295\u1295 \u12A0\u12F2\u1235 \u12E8\u122B\u1235 \u12A0\u1308\u120D\u130B\u12ED \u121B\u12CB\u1240\u122D \u12A8\u12CD\u132D \u121B\u1235\u1218\u1323\u1275 \u12A0\u1201\u1295 \u12EB\u1208\u12CD\u1295 \u12E8\u1290\u1243 \u12E8\u12F3\u1273 \u12AB\u1273\u120E\u130D \u12A5\u1293 \u12E8\u12F3\u1273 \u1230\u1240\u120B \u121D\u1295\u132E\u127D\u1295 \u12ED\u1270\u12AB\u12CB\u120D\u1362 \u12ED\u1205\u1295 \u1232\u12EB\u12F0\u122D\u1309\u1363 \u1260\u1218\u1323\u12CD \u121B\u12CB\u1240\u122D \u12CD\u1235\u1325 \u12EB\u120D\u1270\u12AB\u1270\u1271 \u1208\u12CD\u1326\u127D\u1295 \u12A5\u1295\u12F0\u1308\u1293 \u1218\u1343\u134D \u12A5\u1295\u12F0\u121A\u127D\u1209 \u120D\u1265 \u12ED\u1260\u1209\u1362 \u12ED\u1205\u1295 \u1270\u130D\u1263\u122D \u12A8\u1328\u1228\u1231 \u1260\u128B\u120B\u1363 \u1260\u12A0\u12F2\u1231 \u12E8\u122B\u1235 \u12A0\u1308\u120D\u130B\u12ED \u121B\u12CB\u1240\u122D \u120B\u12ED \u127D\u130D\u122D \u12A8\u1270\u1348\u1320\u1228\u1363 \u12E8\u12A0\u1201\u1291\u1295 \u12E8\u122B\u1235 \u12A0\u1308\u120D\u130B\u12ED \u121B\u12CB\u1240\u122D (\u1260\u12A5\u122D\u1235\u12CE \u12A0\u12CD\u122D\u12F6\u127D \u12A0\u1243\u134A \u12CD\u1235\u1325 \u12E8\u121A\u1308\u1298\u12CD) \u12A5\u1295\u12F0\u1308\u1293 \u121B\u1235\u1218\u1323\u1275 \u12ED\u127D\u120B\u1209\u1362',
    'Are you sure you want to import %(csvFileName)s?':
      '\u12A5\u122D\u130D\u1320\u129B \u1290\u12CE\u1275 %(csvFileName)s \u1295 \u121B\u1235\u1308\u1263\u1275 \u12ED\u1348\u120D\u130B\u1209?',
    'Are you sure you want to import %(fileName)s?':
      '\u12A5\u122D\u130D\u1320\u129B \u1290\u12CE\u1275 %(fileName)s \u1295 \u121B\u1235\u1308\u1263\u1275 \u12ED\u1348\u120D\u130B\u1209?',
    'Complete Upload': '\u1219\u1209 \u132D\u1290\u1275',
    'Download current self serve setup for backup purposes':
      '\u1208\u1218\u1320\u1263\u1260\u1242\u12EB \u12D3\u120B\u121B\u12CE\u127D \u12E8\u12A0\u1201\u1291\u1295 \u12E8\u122B\u1235 \u12A0\u1308\u120D\u130B\u12ED \u121B\u12CB\u1240\u122D \u12EB\u12CD\u122D\u12F1',
    'Download dimension IDs, category mappings and data source IDs to be used when creating new indicators':
      '\u12A0\u12F2\u1235 \u12A0\u1218\u120D\u12AB\u127E\u127D\u1295 \u1260\u121A\u1348\u1325\u1229\u1260\u1275 \u130A\u12DC \u1325\u1245\u121D \u120B\u12ED \u12E8\u121A\u12CD\u1209 \u12E8\u1218\u1320\u1295 \u1218\u1273\u12C8\u1242\u12EB\u12CE\u127D\u1295 \u1363 \u12E8\u121D\u12F5\u1265 \u12AB\u122D\u1273\u12CE\u127D\u1295 \u12A5\u1293 \u12E8\u1218\u1228\u1303 \u121D\u1295\u132D \u1218\u1273\u12C8\u1242\u12EB\u12CE\u127D\u1295 \u12EB\u12CD\u122D\u12F1',
    "Export this instance's self serve setup to be used in other instances":
      '\u1260\u120C\u120E\u127D \u12A0\u130B\u1323\u121A\u12CE\u127D \u1325\u1245\u121D \u120B\u12ED \u12A5\u1295\u12F2\u12CD\u120D \u12E8\u12DA\u1205 \u121D\u1233\u120C \u12E8\u122B\u1235 \u12A0\u1308\u120D\u130B\u12ED \u121B\u12CB\u1240\u122D \u12C8\u12F0 \u12CD\u132D \u12ED\u120B\u12A9\u1362',
    'Import a self serve setup to replace the active one on this instance':
      '\u1260\u12DA\u1205 \u12A0\u130B\u1323\u121A \u1308\u1263\u122A\u12CD\u1295 \u1208\u1218\u1270\u12AB\u1275 \u12E8\u122B\u1235 \u12A0\u1308\u120D\u130B\u12ED \u121B\u12CB\u1240\u122D\u1295 \u12EB\u1235\u1218\u1321',
    'Import confirmation':
      '\u12C8\u12F0 \u1235\u122D\u12D3\u1271 \u121B\u1235\u1308\u1263\u1275 \u1218\u1228\u130B\u1308\u132B',
    'Import new indicators or update existing indicators defined in the Google Sheet CSV':
      '\u12A0\u12F2\u1235 \u12A0\u1218\u120D\u12AB\u127E\u127D\u1295 \u12EB\u1235\u1218\u1321 \u12C8\u12ED\u121D \u1260Google \u1209\u1205 CSV \u12CD\u1235\u1325 \u12E8\u1270\u1308\u1208\u1339\u1275\u1295 \u1290\u1263\u122D \u12A0\u1218\u120D\u12AB\u127E\u127D\u1295 \u12EB\u12D8\u121D\u1291',
    'Select file to import':
      '\u12C8\u12F0 \u1235\u122D\u12D3\u1271 \u1208\u121B\u1235\u1308\u1263\u1275 \u134B\u12ED\u120D \u12ED\u121D\u1228\u1321',
    'Self Serve': '\u122B\u1235\u1295 \u121B\u1308\u120D\u1308\u120D',
    'Your data catalog metadata export will download shortly':
      '\u12E8\u1218\u1228\u1303 \u12AB\u1273\u120E\u130D \u1270\u1328\u121B\u122A \u1218\u1228\u1303\u12CE\u127D \u1260\u12A0\u132D\u122D \u130A\u12DC \u12ED\u12C8\u122D\u12F3\u1209\u1361\u1361',
    'Your fields csv import might take some time to complete':
      '\u12E8\u1218\u1235\u12AE\u127D\u1205 csv \u121B\u1235\u1218\u1323\u1275 \u1208\u121B\u1320\u1293\u1240\u1245 \u12E8\u1270\u12C8\u1230\u1290 \u130A\u12DC \u120A\u12C8\u1235\u12F5 \u12ED\u127D\u120B\u120D\u1362',
    'Your self serve setup export will download shortly':
      '\u12E8\u12A5\u122B\u1235\u12CE \u12A0\u1308\u120D\u130B\u12ED \u121B\u12CB\u1240\u122D \u12C8\u12F0 \u12CD\u132D \u1218\u120B\u12AD \u1260\u1245\u122D\u1261 \u12ED\u12C8\u122D\u12F3\u120D',
    'Your self serve setup import completed successfully':
      '\u12E8\u122B\u1235\u12CE \u12A0\u1308\u120D\u130D\u120E\u1275 \u121B\u1235\u1218\u1323\u1275 \u1260\u1270\u1233\u12AB \u1201\u1294\u1273 \u1270\u1320\u1293\u1245\u124B\u120D',
    'Your self serve setup import might take some time to complete':
      '\u12E8\u122B\u1235\u12CE \u12A0\u1308\u120D\u130D\u120E\u1275 \u121B\u12CB\u1240\u122D \u121B\u1235\u1218\u1323\u1275 \u1208\u121B\u1320\u1293\u1240\u1245 \u12E8\u1270\u12C8\u1230\u1290 \u130A\u12DC \u120A\u12C8\u1235\u12F5 \u12ED\u127D\u120B\u120D\u1362',
    'yes, import':
      '\u12A0\u12CE\u1363 \u12C8\u12F0 \u1235\u122D\u12D3\u1271 \u12EB\u1235\u1308\u1261',
  },
  fr: {
    csvImportSuccess:
      "L'importation csv de vos champs s'est termin\xE9e avec succ\xE8s.",
    exportMetadata: 'Exporter les m\xE9tadonn\xE9es',
    exportSelfServe: 'Exporter la configuration du libre-service (self serve)',
    importCSVFailed: "L'importation csv de vos champs a \xE9chou\xE9.",
    importFailed:
      "\xC9chec de l'importation de la configuration du libre-service (self serve)",
    importFieldsPrompt:
      "L'importation de ce fichier ajoutera de nouveaux champs dans le catalogue de donn\xE9es que vous ne pourrez pas supprimer. Cependant, vous pouvez masquer ces indicateurs. Apr\xE8s avoir termin\xE9 cette action, si un probl\xE8me survient avec la nouvelle configuration du libre-service, vous pouvez r\xE9importer la configuration actuelle du libre-service (qui se trouve dans votre dossier T\xE9l\xE9chargements).",
    importNewIndicators: 'Importer de nouveaux indicateurs',
    importProgress: 'Importation des donn\xE9es...',
    importSelfServe: 'Importer la configuration du libre-service',
    importSetupPrompt:
      "L'importation de cette nouvelle configuration en libre-service \xE9crasera le catalogue de donn\xE9es et les sources de t\xE9l\xE9chargement de donn\xE9es actuellement actifs. Ce faisant, notez que vous pouvez \xE9craser les modifications non incluses dans la configuration import\xE9e. Apr\xE8s avoir termin\xE9 cette action, si un probl\xE8me survient avec la nouvelle configuration du libre-service, vous pouvez r\xE9importer la configuration actuelle du libre-service (qui se trouve dans votre dossier T\xE9l\xE9chargements).",
    'Are you sure you want to import %(csvFileName)s?':
      'Voulez-vous vraiment importer %(csvFileName)s\xA0?',
    'Are you sure you want to import %(fileName)s?':
      'Voulez-vous vraiment importer %(fileName)s\xA0?',
    'Complete Upload': 'compl\xE9ter le t\xE9l\xE9chargement',
    'Download current self serve setup for backup purposes':
      'T\xE9l\xE9charger la configuration libre-service actuelle \xE0 des fins de sauvegarde',
    'Download dimension IDs, category mappings and data source IDs to be used when creating new indicators':
      'T\xE9l\xE9charger les ID de dimension, les mappages de cat\xE9gories et les ID de source de donn\xE9es \xE0 utiliser lors de la cr\xE9ation de nouveaux indicateurs',
    "Export this instance's self serve setup to be used in other instances":
      "Exporter la configuration libre-service de cette instance pour l'utiliser dans d'autres instances",
    'Import a self serve setup to replace the active one on this instance':
      'Importer une configuration en libre-service pour remplacer celle qui est active sur cette instance',
    'Import confirmation': "Confirmation d'importation",
    'Import new indicators or update existing indicators defined in the Google Sheet CSV':
      'Importez de nouveaux indicateurs ou mettez \xE0 jour les indicateurs existants d\xE9finis dans le CSV Google Sheet',
    'Self Serve': 'Libre-service',
    'Your data catalog metadata export will download shortly':
      "L'exportation des m\xE9tadonn\xE9es de votre catalogue de donn\xE9es va bient\xF4t \xEAtre t\xE9l\xE9charg\xE9e",
    'Your fields csv import might take some time to complete':
      "L'importation csv de vos champs peut prendre un certain temps",
    'Your self serve setup export will download shortly':
      "L'exportation de votre configuration du libre-service va bient\xF4t \xEAtre t\xE9l\xE9charg\xE9e",
    'Your self serve setup import completed successfully':
      "L'importation de votre configuration du libre-service s'est termin\xE9e avec succ\xE8s",
    'Your self serve setup import might take some time to complete':
      "L'importation de votre configuration du libre-service peut prendre un certain temps",
    'yes, import': 'oui, importer',
  },
  br: {
    csvImportSuccess: 'Importação csv concluída com sucesso.',
    exportMetadata: 'Exportar metadados',
    exportSelfServe:
      'Configura\xE7\xE3o de auto-atendimento para exporta\xE7\xE3o',
    importCSVFailed: 'Seus campos de importa\xE7\xE3o csv falharam.',
    importFailed: 'Sua importa\xE7\xE3o de autom\xE1tica falhou.',
    importFieldsPrompt:
      'A importa\xE7\xE3o deste arquivo adicionar\xE1 novos campos ao cat\xE1logo de dados que voc\xEA n\xE3o poder\xE1 remover. No entanto, voc\xEA \xE9 capaz de ocultar estes indicadores. Ap\xF3s completar esta a\xE7\xE3o, se surgir um problema com a nova configura\xE7\xE3o de auto-atendimento, voc\xEA poder\xE1 reimportar a configura\xE7\xE3o atual de auto-atendimento (encontrada em sua pasta Downloads).',
    importNewIndicators: 'Importar novos indicadores',
    importProgress: 'Importa\xE7\xE3o de dados...',
    importSelfServe: 'Configura\xE7\xE3o de importa\xE7\xE3o autom\xE1tica',
    importSetupPrompt:
      'A importa\xE7\xE3o desta nova configura\xE7\xE3o de auto-atendimento sobregravar\xE1 o cat\xE1logo de dados atualmente ativo e as fontes de carregamento de dados. Ao fazer isso, observe que voc\xEA pode sobrescrever as mudan\xE7as n\xE3o inclu\xEDdas na configura\xE7\xE3o importada. Ap\xF3s completar esta a\xE7\xE3o, se surgir um problema com a nova configura\xE7\xE3o de autoatendimento, voc\xEA poder\xE1 reimportar a configura\xE7\xE3o atual de autoatendimento (encontrada em sua pasta Downloads).',
    '%(fileName)s Passes Validation': '%(fileName)s passa na valida\\xE7\\xE3o',
    '%(fileName)s contains potential conflicts':
      '%(fileName)s cont\\xE9m poss\\xEDveis conflitos',
    'Are you sure you want to import %(csvFileName)s?':
      'Voc\xEA tem certeza de que quer importar %(csvFileName)s?',
    'Are you sure you want to import %(fileName)s?':
      'Voc\xEA tem certeza de que quer importar %(fileName)s?',
    'Complete Upload': 'Upload completo',
    'Download current self serve setup for backup purposes':
      'Download da configura\xE7\xE3o atual de auto-atendimento para fins de backup',
    'Download dimension IDs, category mappings and data source IDs to be used when creating new indicators':
      'Download de IDs de dimens\xF5es, mapeamentos de categorias e IDs de fontes de dados a serem usados na cria\xE7\xE3o de novos indicadores',
    "Export this instance's self serve setup to be used in other instances":
      'Exportar a configura\xE7\xE3o de auto-atendimento desta inst\xE2ncia para ser usada em outras inst\xE2ncias',
    'Import a self serve setup to replace the active one on this instance':
      'Importar uma configura\xE7\xE3o de auto-atendimento para substituir a ativa neste caso',
    'Import a self serve setup to replace the active one on this instance_ You can export this setup in the Admin App in the Site Configuration tab_ This setup will replace the existing metadata in this instance for the following records: Field, Field Category, Dimension, Dimension Category, and Datasource_':
      'Importe uma configura\\xE7\\xE3o de autoatendimento para substituir a configura\\xE7\\xE3o ativa nessa inst\\xE2ncia. Voc\\xEA pode exportar essa configura\\xE7\\xE3o no aplicativo Admin, na guia Site Configuration (Configura\\xE7\\xE3o do site). Essa configura\\xE7\\xE3o substituir\\xE1 os metadados existentes nessa inst\\xE2ncia para os seguintes registros: Field (Campo), Field Category (Categoria de campo), Dimension (Dimens\\xE3o), Dimension Category (Categoria de dimens\\xE3o) e Datasource (Fonte de dados).',
    'Import confirmation': 'Confirma\xE7\xE3o de importa\xE7\xE3o',
    'Import new indicators or update existing indicators defined in the Google Sheet CSV':
      'Importar novos indicadores ou atualizar indicadores existentes definidos no Google Sheet CSV',
    'Looks like the upload failed': 'Parece que o upload falhou',
    'Select file to import': 'Selecione o arquivo a ser importado',
    'Self Serve': 'Auto-servi\xE7o',
    'Your data catalog conflicts summary file will download shortly':
      'Seu arquivo de resumo de conflitos do cat\\xE1logo de dados ser\\xE1 baixado em breve',
    'Your data catalog metadata export will download shortly':
      'Sua exporta\xE7\xE3o de metadados do cat\xE1logo de dados ser\xE1 baixada em breve',
    'Your fields csv import might take some time to complete':
      'Seus campos de importa\xE7\xE3o csv podem levar algum tempo para serem completados',
    'Your self serve setup export will download shortly':
      'Seu auto-servi\xE7o de configura\xE7\xE3o de exporta\xE7\xE3o ser\xE1 baixado em breve',
    'Your self serve setup import completed successfully':
      'Sua importa\xE7\xE3o de auto-atendimento conclu\xEDda com sucesso',
    'Your self serve setup import might take some time to complete':
      'Sua importa\xE7\xE3o de auto-atendimento pode levar algum tempo para ser conclu\xEDda.',
    'yes, import': 'sim, importar',
  },
};
export default translations;
