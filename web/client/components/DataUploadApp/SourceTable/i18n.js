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
    CSV: 'CSV',
    Dataprep: 'Dataprep',
    Manage: 'Manage',
    deleteCSVSourceConfirmation:
      "By deleting source '%(sourceName)s', the data will disappear from the platform. This action cannot be undone. If the data has already been integrated, it will be removed when the pipeline next runs.",
    deleteDataprepSourceConfirmation:
      "By deleting source '%(sourceName)s', the source will be removed from Data Upload. The data will remain in the platform.",
    noSources: 'There are no data sources at this time.',
    queued: 'queued',
    'Date of submission': 'Date of submission',
    'Date range information will appear on next pipeline run':
      'Date range information will appear on next pipeline run',
    'Edit setup': 'Edit setup',
    'Error deleting source': 'Error deleting source',
    'Go to setup page': 'Go to setup page',
    'Integration type': 'Integration type',
    'Last updated': 'Last updated',
    'New indicator count': 'New indicator count',
    'No date range information': 'No date range information',
    'See job': 'See job',
    'Time range of data': 'Time range of data',
    'Update Data': 'Update Data',
    'dataprep failed': 'dataprep failed',
    'dataprep running': 'dataprep running',
    'delete source': 'delete source',
    'unpublished-indicators-count': {
      one: '%(count)s new indicator',
      other: '%(count)s new indicators',
      zero: 'No new indicators',
    },
    'update failed': 'update failed',
  },
  pt: {
    CSV: 'CSV',
    Dataprep: 'Dataprep',
    Manage: 'Gerir',
    deleteCSVSourceConfirmation:
      "Apagando a fonte '%(sourceName)s', os dados desaparecer\xE3o da plataforma. Esta a\xE7\xE3o n\xE3o pode ser desfeita. Se os dados j\xE1 tiverem sido integrados, eles ser\xE3o removidos quando o gasoduto for executado em seguida.",
    deleteDataprepSourceConfirmation: '',
    noSources: 'N\xE3o h\xE1 fontes de dados neste momento.',
    queued: 'Pesquisado',
    'Date of submission': 'Data da submi\xE7\xE3o',
    'Date range information will appear on next pipeline run':
      'Informa\xE7\xE3o de intervalo de data estar\xE1 disponivel no proximo pipeline',
    'Edit setup': 'Editar defini\xE7\xF5es',
    'Error deleting source': 'Erro ao apagar a fonte',
    'Go to setup page': 'Ir para a p\xE1gina de configura\xE7\xE3o',
    'Integration type': 'Tipo de integra\xE7\xE3o',
    'Last updated': '\xDAltima actualiza\xE7\xE3o',
    'New indicator count': 'Nova contagem de indicadores',
    'No date range information':
      'Sem informa\xE7\xE3o sobre o intervalo de datas',
    'See job': 'Ver trabalho',
    'Time range of data': 'Intervalo de tempo dos dados',
    'Update Data': 'Actualizar dados',
    'dataprep failed': 'Dataapreprep falhou',
    'dataprep running': 'execu\xE7\xE3o do dataprep',
    'delete source': 'apagar fonte',
    'unpublished-indicators-count': {
      one: '%(count)s novo indicador',
      other: '%(count)s novos indicadores',
      zero: 'Sem novos indicadores',
    },
    'update failed': 'atualiza\xE7\xE3o falhou',
  },
  vn: {
    CSV: 'CSV',
    Dataprep: 'Dataprep',
    Manage: 'Qu\u1EA3n l\xFD',
    deleteCSVSourceConfirmation:
      "B\u1EB1ng c\xE1ch x\xF3a ngu\u1ED3n '%(sourceName)s', d\u1EEF li\u1EC7u s\u1EBD bi\u1EBFn m\u1EA5t kh\u1ECFi n\u1EC1n t\u1EA3ng. H\xE0nh \u0111\u1ED9ng n\xE0y kh\xF4ng th\u1EC3 \u0111\u01B0\u1EE3c ho\xE0n t\xE1c. N\u1EBFu d\u1EEF li\u1EC7u \u0111\xE3 \u0111\u01B0\u1EE3c t\xEDch h\u1EE3p, n\xF3 s\u1EBD b\u1ECB x\xF3a khi ch\u1EA1y pipeline ti\u1EBFp theo.",
    deleteDataprepSourceConfirmation:
      "B\u1EB1ng c\xE1ch xo\xE1 ngu\u1ED3n '%(sourceName)s', ngu\u1ED3n n\xE0y s\u1EBD b\u1ECB xo\xE1 kh\u1ECFi Data Upload. D\u1EEF li\u1EC7u s\u1EBD v\u1EABn c\xF2n l\u1EA1i trong n\u1EC1n t\u1EA3ng",
    noSources:
      'Kh\xF4ng c\xF3 ngu\u1ED3n d\u1EEF li\u1EC7u n\xE0o t\u1EA1i th\u1EDDi \u0111i\u1EC3m n\xE0y.',
    queued: 'x\u1EBFp h\xE0ng',
    'Date of submission': 'Ng\xE0y g\u1EEDi',
    'Date range information will appear on next pipeline run':
      'Th\xF4ng tin ph\u1EA1m vi ng\xE0y s\u1EBD xu\u1EA5t hi\u1EC7n trong l\u1EA7n ch\u1EA1y pipeline ti\u1EBFp theo',
    'Edit setup': 'Ch\u1EC9nh s\u1EEDa thi\u1EBFt l\u1EADp',
    'Error deleting source': 'L\u1ED7i khi x\xF3a ngu\u1ED3n',
    'Go to setup page': '\u0110i t\u1EDBi trang thi\u1EBFt l\u1EADp',
    'Integration type': 'Ki\u1EC3u t\xEDch h\u1EE3p',
    'Last updated': 'C\u1EADp nh\u1EADt m\u1EDBi nh\u1EA5t',
    'New indicator count': '\u0110\u1EBFm s\u1ED1 ch\u1EC9 b\xE1o m\u1EDBi',
    'No date range information':
      'Kh\xF4ng c\xF3 th\xF4ng tin ph\u1EA1m vi ng\xE0y',
    'See job': 'Xem c\xF4ng vi\u1EC7c',
    'Time range of data':
      'Ph\u1EA1m vi th\u1EDDi gian c\u1EE7a d\u1EEF li\u1EC7u',
    'Update Data': 'C\u1EADp nh\u1EADt d\u1EEF li\u1EC7u',
    'dataprep failed': 'dataprep b\u1ECB l\u1ED7i',
    'dataprep running': 'dataprep \u0111ang ch\u1EA1y',
    'delete source': 'X\xF3a ngu\u1ED3n',
    'unpublished-indicators-count': {
      one: '%(count)s ch\u1EC9 s\u1ED1 m\u1EDBi',
      other: '%(count)s c\xE1c ch\u1EC9 s\u1ED1 m\u1EDBi',
      zero: 'Kh\xF4ng c\xF3 ch\u1EC9 s\u1ED1 m\u1EDBi',
    },
    'update failed': 'c\u1EADp nh\u1EADt kh\xF4ng th\xE0nh c\xF4ng',
  },
  am: {
    CSV: 'CSV',
    Dataprep: '\u12F3\u1273 \u1355\u122C\u1355',
    Manage: '\u121B\u1235\u1270\u12F3\u12F0\u122D',
    deleteCSVSourceConfirmation:
      "\u12E8\u1218\u1228\u1303 \u121D\u1295\u132D '%(sourceName)s' \u1295 \u1260\u1218\u1230\u1228\u12DD \u1218\u1228\u1303\u12CD \u12A8\u1235\u122D\u12D3\u1271 \u12ED\u1320\u134B\u120D\u1362 \u12ED\u1205 \u12A5\u122D\u121D\u1303 \u120A\u1240\u1208\u1260\u1235 \u12A0\u12ED\u127D\u120D\u121D\u1362 \u1218\u1228\u1303\u12CD \u1240\u12F5\u121E\u12CD\u1291 \u12A8\u1270\u12CB\u1203\u12F0 \u1363 \u12A8\u1275\u1295\u123D \u130A\u12DC \u1260\u128B\u120B \u12ED\u12C8\u1308\u12F3\u120D\u1362",
    deleteDataprepSourceConfirmation:
      "\u121D\u1295\u132D '%(sourceName)s'\u1295 \u1260\u1218\u1230\u1228\u12DD \u121D\u1295\u1329 \u12A8\u12F3\u1273 \u1230\u1240\u120B \u12ED\u12C8\u1308\u12F3\u120D\u1362 \u12CD\u1202\u1261 \u1260\u1218\u12F5\u1228\u12A9 \u12CD\u1235\u1325 \u12ED\u1240\u122B\u120D\u1362",
    noSources:
      '\u121D\u1295\u121D \u12D3\u12ED\u1290\u1275 \u12E8\u1218\u1228\u1303 \u121D\u1295\u132E\u127D \u12A0\u120D\u1270\u1308\u1298\u121D\u1361\u1361',
    queued: '\u1270\u1230\u120D\u134F\u120D',
    'Date of submission': '\u12E8\u1308\u1263\u1260\u1275 \u1240\u1295',
    'Date range information will appear on next pipeline run':
      '\u12E8\u1240\u1295 \u122C\u1295\u1305 \u1218\u1228\u1303 \u1260\u121A\u1240\u1325\u1208\u12CD \u1353\u12ED\u1355 \u120B\u12ED\u1295 \u120B\u12ED \u12ED\u1273\u12EB\u120D',
    'Edit setup':
      '\u1218\u12CB\u1240\u1290\u1295 \u12A4\u12F2\u1275 \u12EB\u12F5\u122D\u1309',
    'Error deleting source':
      '\u121D\u1295\u132D\u1295 \u1218\u1230\u1228\u12DD \u120B\u12ED \u1235\u1205\u1270\u1275 \u12A0\u1208',
    'Go to setup page':
      '\u12C8\u12F0 \u1234\u1273\u1355 \u1308\u133D \u12ED\u1202\u12F1',
    'Integration type':
      '\u12E8\u12A2\u1295\u1270\u130D\u122C\u123D\u1295 \u12D3\u12ED\u1290\u1275',
    'Last updated': '\u1218\u1328\u1228\u123B \u12E8\u12D8\u1218\u1290\u12C9',
    'New indicator count':
      '\u12A0\u12F2\u1235 \u12A0\u1218\u120B\u12AB\u127D \u1246\u1320\u122B',
    'No date range information':
      '\u12E8\u130A\u12DC \u1218\u1228\u1303 \u12A0\u120D\u1270\u1308\u1298\u121D',
    'See job': '\u1225\u122B \u1270\u1218\u120D\u12A8\u1275',
    'Time range of data':
      '\u12E8\u1218\u1228\u1303 \u130A\u12DC \u123D\u134B\u1295',
    'Update Data': '\u12E8\u12D8\u1218\u1290 \u1218\u1228\u1303',
    'dataprep failed':
      '\u12F3\u1273\u1355\u122C\u1355 \u12A0\u120D\u1270\u1233\u12AB\u121D',
    'dataprep running':
      '\u12F3\u1273\u1355\u122C\u1355 \u12A5\u12E8\u122E\u1320 \u1290\u12CD',
    'delete source': '\u121D\u1295\u132D\u1295 \u12ED\u1230\u122D\u12D9',
    'unpublished-indicators-count': {
      one: '%(count)s \u12A0\u12F2\u1235 \u12A0\u1218\u120D\u12AB\u127D',
      other:
        '%(count)s \u12A0\u12F2\u1235 \u12A0\u1218\u120B\u12AB\u127E\u127D',
      zero:
        '\u121D\u1295\u121D \u12A0\u12F2\u1235 \u1320\u124B\u121A\u12CE\u127D \u12E8\u1208\u121D',
    },
    'update failed': '\u12EB\u120D\u1270\u1233\u12AB \u121B\u12D8\u1218\u1295',
  },
  fr: {
    CSV: 'CSV',
    Dataprep: 'Pr\xE9paration des donn\xE9es (Dataprep)',
    Manage: 'G\xE9rer',
    deleteCSVSourceConfirmation:
      "En supprimant la source '%(sourceName)s', les donn\xE9es dispara\xEEtront de la plateforme. Cette action ne peut pas \xEAtre annul\xE9e. Si les donn\xE9es ont d\xE9j\xE0 \xE9t\xE9 int\xE9gr\xE9es, elles seront supprim\xE9es lors de la prochaine ex\xE9cution du pipeline.",
    deleteDataprepSourceConfirmation: '',
    noSources: "Il n'y a pas de sources de donn\xE9es pour le moment.",
    queued: "mis en file d'attente",
    'Date of submission': 'Date de soumission',
    'Date range information will appear on next pipeline run':
      'Les informations sur la plage de dates appara\xEEtront lors de la prochaine ex\xE9cution du pipeline',
    'Edit setup': 'Modifier la configuration',
    'Error deleting source': 'Erreur lors de la suppression de la source',
    'Go to setup page': 'Aller \xE0 la page de configuration',
    'Integration type': "Type d'int\xE9gration",
    'Last updated': 'Derni\xE8re mise \xE0 jour',
    'New indicator count': "Nouveau nombre d'indicateurs",
    'No date range information': 'Aucune information sur la plage de dates',
    'See job': 'Voir le processus',
    'Time range of data': 'Plage de temps des donn\xE9es',
    'Update Data': 'Mettre \xE0 jour les donn\xE9es',
    'dataprep failed':
      'la pr\xE9paration des donn\xE9es (dataprep) a \xE9chou\xE9',
    'dataprep running':
      "pr\xE9paration des donn\xE9es (dataprep) en cours d'ex\xE9cution",
    'delete source': 'supprimer la source',
    'unpublished-indicators-count': {
      one: '%(count)s nouvel indicateur',
      other: '%(count)s nouveaux indicateurs',
      zero: 'Pas de nouveaux indicateurs',
    },
    'update failed': 'mise \xE0 jour a \xE9chou\xE9',
  },
  br: {
    CSV: 'CSV',
    Dataprep: 'Dataprep',
    Manage: 'Gerir',
    deleteCSVSourceConfirmation:
      "Apagando a fonte '%(sourceName)s', os dados desaparecer\xE3o da plataforma. Esta a\xE7\xE3o n\xE3o pode ser desfeita. Se os dados j\xE1 tiverem sido integrados, eles ser\xE3o removidos quando o gasoduto for executado em seguida.",
    deleteDataprepSourceConfirmation:
      "Ao excluir a fonte '%(sourceName)s', a fonte ser\xE1 removida do Upload de dados. Os dados permanecer\xE3o na plataforma.",
    noSources: 'N\xE3o h\xE1 fontes de dados neste momento.',
    queued: 'Pesquisado',
    'Date of submission': 'Data da submi\xE7\xE3o',
    'Date range information will appear on next pipeline run':
      'Informa\xE7\xE3o de intervalo de data estar\xE1 disponivel no proximo pipeline',
    'Edit setup': 'Editar defini\xE7\xF5es',
    'Error deleting source': 'Erro ao apagar a fonte',
    'Go to setup page': 'Ir para a p\xE1gina de configura\xE7\xE3o',
    'Integration type': 'Tipo de integra\xE7\xE3o',
    'Last updated': '\xDAltima actualiza\xE7\xE3o',
    'New indicator count': 'Nova contagem de indicadores',
    'No date range information':
      'Sem informa\xE7\xE3o sobre o intervalo de datas',
    'See job': 'Ver trabalho',
    'Time range of data': 'Intervalo de tempo dos dados',
    'Update Data': 'Actualizar dados',
    'dataprep failed': 'Dataapreprep falhou',
    'dataprep running': 'execu\xE7\xE3o do dataprep',
    'delete source': 'eliminar fonte',
    'unpublished-indicators-count': {
      one: '%(count)s novo indicador',
      other: '%(count)s novos indicadores',
      zero: 'Sem novos indicadores',
    },
    'update failed': 'atualiza\xE7\xE3o falhou',
  },
};
export default translations;
