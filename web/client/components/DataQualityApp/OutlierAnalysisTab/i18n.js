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
    Mean: 'Mean',
    Table: 'Table',
    extreme: 'extreme',
    extremeLowerBound: 'Extreme (3+ stdev from mean) outlier lower bound',
    extremeUpperBound: 'Extreme (3+ stdev from mean) outlier upper bound',
    moderate: 'moderate',
    noFacilitySelectedExplanation:
      "Click a datapoint on the box plot above to view that facility's data with outliers marked here",
    noFacilitySelectedTitle: 'No facility Selected',
    outlierLowerBound: 'Moderate (2+ stdev from mean) outlier lower bound',
    outlierUpperBound: 'Moderate (2+ stdev from mean) outlier upper bound',
    '# All Reports': '# All Reports',
    '# Outlier Reports': '# Outlier Reports',
    '%% Outlier Reports': '%% Outlier Reports',
    '%% of facility data points that are %(outlierType)s outliers':
      '%% of facility data points that are %(outlierType)s outliers',
    '%% of facility data points that are %(outlierType)s outliers by %(geography)s':
      '%% of facility data points that are %(outlierType)s outliers by %(geography)s',
    '%% of reported values that are outliers':
      '%% of reported values that are outliers',
    '%(numReports)s reports have been received from %(numFacilities)s facilities since %(firstReportDate)s_':
      '%(numReports)s reports have been received from %(numFacilities)s facilities since %(firstReportDate)s.',
    'All (2+ stdev from mean)': 'All (2+ stdev from mean)',
    'Box Plot': 'Box Plot',
    'Click to view reported data & outliers on time series below':
      'Click to view reported data & outliers on time series below',
    'Data Outlier Analysis Score Explanation':
      'Data Outlier Analysis Score Explanation',
    'Each dot on the box plot represents the %% of reported values that are outliers for a single facility_':
      'Each dot on the box plot represents the %% of reported values that are outliers for a single facility.',
    'Extreme (3+ stdev from mean)': 'Extreme (3+ stdev from mean)',
    'Investigate Outliers': 'Investigate Outliers',
    'Moderate (2-3 stdev from mean)': 'Moderate (2-3 stdev from mean)',
    'Note that for indicators with strong seasonality, there will be a higher proportion of outlier data points by definition and this may not mean there are actual data quality issues_':
      'Note that for indicators with strong seasonality, there will be a higher proportion of outlier data points by definition and this may not mean there are actual data quality issues.',
    'Note that the mean value for each facility is calculated using all historical data, even if you have a time filter set_ Options to choose dates to exclude from this calculation are coming soon and will be found here_':
      'Note that the mean value for each facility is calculated using all historical data, even if you have a time filter set. Options to choose dates to exclude from this calculation are coming soon and will be found here.',
    'Outlier type': 'Outlier type',
    'Proportion of facility data points that are extreme outliers:':
      'Proportion of facility data points that are extreme outliers:',
    'Proportion that are moderate outliers:':
      'Proportion that are moderate outliers:',
    'Reporting Period': 'Reporting Period',
    'Reports Received': 'Reports Received',
    "This tool identifies data points that are extreme outliers (3+ standard deviations from the mean) and moderate outliers (2-3 standard deviations) relative to a facility's historical mean_ The higher the average proportion of outliers, the worse it is for the quality score_":
      "This tool identifies data points that are extreme outliers (3+ standard deviations from the mean) and moderate outliers (2-3 standard deviations) relative to a facility's historical mean. The higher the average proportion of outliers, the worse it is for the quality score.",
    'This tool is intended to help you isolate data points which are outliers relative to the mean for each facility_':
      'This tool is intended to help you isolate data points which are outliers relative to the mean for each facility.',
    "You can click on each dot to view that facility's data on a time series below and see which datapoints are outliers relative to the mean_ Some of the outliers may be erroneous and require follow up with the facility to understand & resolve_":
      "You can click on each dot to view that facility's data on a time series below and see which datapoints are outliers relative to the mean. Some of the outliers may be erroneous and require follow up with the facility to understand & resolve.",
  },
  pt: {
    Mean: 'M\xE9dia',
    Table: 'Tabela',
    extreme: 'extremo',
    extremeLowerBound:
      'Extremo (3+ stdev a partir da m\xE9dia) limite inferior',
    extremeUpperBound:
      'Extremo (3+ stdev a partir da m\xE9dia) limite superior anterior',
    moderate: 'moderado',
    noFacilitySelectedExplanation:
      'Clique em um ponto de dados no gr\xE1fico de caixa/extremo acima para visualizar os dados dessa instala\xE7\xE3o com outliers marcados aqui',
    noFacilitySelectedTitle: 'Nenhuma instala\xE7\xE3o selecionada',
    outlierLowerBound:
      'Moderado (2+ stdev a partir da m\xE9dia) limite inferior anterior',
    outlierUpperBound:
      'Moderado (2+ stdev da m\xE9dia) limite superior anterior',
    '# All Reports': '# Todos os relat\xF3rios',
    '# Outlier Reports': '# Relat\xF3rios anteriores',
    '%% Outlier Reports': '%% Relat\xF3rios anteriores',
    '%% of facility data points that are %(outlierType)s outliers':
      '%% de dados de instala\xE7\xF5es que s\xE3o %(outlierType)s outliers',
    '%% of facility data points that are %(outlierType)s outliers by %(geography)s':
      '%% de dados de instala\xE7\xF5es que s\xE3o %(outlierType)s outliers por %(geography)s',
    '%% of reported values that are outliers':
      '%% dos valores reportados que s\xE3o aberrantes',
    '%(numReports)s reports have been received from %(numFacilities)s facilities since %(firstReportDate)s_':
      'Relat\xF3rios de %(numReports)s foram recebidos de %(numFacilities)s instala\xE7\xF5es desde %(firstReportDate)s.',
    'All (2+ stdev from mean)': 'Todos (2+ stdev da m\xE9dia)',
    'Box Plot': 'Diagrama de caixa',
    'Click to view reported data & outliers on time series below':
      'Clique para ver os dados reportados e os outliers das s\xE9ries cronol\xF3gicas abaixo',
    'Data Outlier Analysis Score Explanation':
      'Explica\xE7\xE3o da Pontua\xE7\xE3o das An\xE1lises de Outliers',
    'Each dot on the box plot represents the %% of reported values that are outliers for a single facility_':
      'Cada ponto no boxplot representa a %% dos valores relatados que s\xE3o valores at\xEDpicos para uma \xFAnica instala\xE7\xE3o.',
    'Extreme (3+ stdev from mean)': 'Extrema (3+ stdev da m\xE9dia)',
    'Investigate Outliers': 'Investigar Outliers',
    'Moderate (2-3 stdev from mean)': 'Moderada (2-3 stdev da m\xE9dia)',
    'Note that for indicators with strong seasonality, there will be a higher proportion of outlier data points by definition and this may not mean there are actual data quality issues_':
      'Note que para os indicadores com forte sazonalidade, haver\xE1 uma maior propor\xE7\xE3o de outliers, por defini\xE7\xE3o, e isso pode n\xE3o significar que hajam quest\xF5es reais de qualidade de dados.',
    'Note that the mean value for each facility is calculated using all historical data, even if you have a time filter set_ Options to choose dates to exclude from this calculation are coming soon and will be found here_':
      'Note que o valor m\xE9dio para cada instala\xE7\xE3o \xE9 calculada usando todos os dados hist\xF3ricos, mesmo se voc\xEA tiver um conjunto de filtros de tempo. Op\xE7\xF5es para escolher datas para serem excluidas desse c\xE1lculo est\xE3o chegando em breve e vai ser encontrada aqui.',
    'Outlier type': 'Tipo de Outlier',
    'Proportion of facility data points that are extreme outliers:':
      'Propor\xE7\xE3o de pontos de dados que s\xE3o valores at\xEDpicos extremos:',
    'Proportion that are moderate outliers:':
      'Propor\xE7\xE3o que s\xE3o valores at\xEDpicos moderados:',
    'Reporting Period': 'Per\xEDodo de relat\xF3rio',
    'Reports Received': 'Relat\xF3rios Recebidos',
    "This tool identifies data points that are extreme outliers (3+ standard deviations from the mean) and moderate outliers (2-3 standard deviations) relative to a facility's historical mean_ The higher the average proportion of outliers, the worse it is for the quality score_":
      'Esta ferramenta identifica pontos que s\xE3o valores at\xEDpicos extremos (3 + desvios padr\xE3o da m\xE9dia) e outliers moderadas (2-3 desvios padr\xE3o) em rela\xE7\xE3o \xE0 m\xE9dia hist\xF3rica de uma instala\xE7\xE3o. Quanto maior a propor\xE7\xE3o m\xE9dia de outliers, pior \xE9 para o \xEDndice de qualidade.',
    'This tool is intended to help you isolate data points which are outliers relative to the mean for each facility_':
      'Esta ferramenta se destina a ajudar a isolar pontos de dados que s\xE3o discrepantes em rela\xE7\xE3o \xE0 m\xE9dia para cada instala\xE7\xE3o.',
    "You can click on each dot to view that facility's data on a time series below and see which datapoints are outliers relative to the mean_ Some of the outliers may be erroneous and require follow up with the facility to understand & resolve_":
      'Voc\xEA pode clicar em cada ponto para ver os dados de cada instala\xE7\xE3o em uma s\xE9rie de tempo e ver quais pontos de dados s\xE3o discrepantes em rela\xE7\xE3o \xE0 m\xE9dia. Alguns dos valores at\xEDpicos podem ser incorrectos e exigem acompanhamento com a instala\xE7\xE3o.',
  },
  vn: {
    Mean: 'Mean',
    Table: 'B\u1EA3ng',
    extreme: 'v\xF4 c\xF9ng',
    extremeLowerBound:
      'C\u1EF1c (3+ stdev t\u1EEB trung b\xECnh) ngo\u1EA1i l\u1EC7 gi\u1EDBi h\u1EA1n th\u1EA5p h\u01A1n',
    extremeUpperBound:
      'C\u1EF1c (3+ stdev t\u1EEB gi\xE1 tr\u1ECB trung b\xECnh) v\u01B0\u1EE3t ra ngo\xE0i gi\u1EDBi h\u1EA1n tr\xEAn',
    moderate: 'v\u1EEBa ph\u1EA3i',
    noFacilitySelectedExplanation:
      'Nh\u1EA5p v\xE0o \u0111i\u1EC3m d\u1EEF li\u1EC7u tr\xEAn \xF4 h\u1ED9p \u1EDF tr\xEAn \u0111\u1EC3 xem d\u1EEF li\u1EC7u c\u1EE7a c\u01A1 s\u1EDF \u0111\xF3 v\u1EDBi c\xE1c \u0111i\u1EC3m ngo\u1EA1i l\u1EC7 \u0111\u01B0\u1EE3c \u0111\xE1nh d\u1EA5u \u1EDF \u0111\xE2y',
    noFacilitySelectedTitle:
      'Kh\xF4ng c\xF3 c\u01A1 s\u1EDF n\xE0o \u0111\u01B0\u1EE3c ch\u1ECDn',
    outlierLowerBound:
      'Trung b\xECnh (2+ stdev t\u1EEB trung b\xECnh) ngo\u1EA1i tr\u1EEB gi\u1EDBi h\u1EA1n d\u01B0\u1EDBi',
    outlierUpperBound:
      'Trung b\xECnh (2+ stdev t\u1EEB trung b\xECnh) v\u01B0\u1EE3t ra ngo\xE0i gi\u1EDBi h\u1EA1n tr\xEAn',
    '# All Reports': '# T\u1EA5t c\u1EA3 B\xE1o c\xE1o',
    '# Outlier Reports': '# B\xE1o c\xE1o Ngo\u1EA1i l\u1EC7',
    '%% Outlier Reports': '%% B\xE1o c\xE1o Nh\xE0 xu\u1EA5t b\u1EA3n',
    '%% of facility data points that are %(outlierType)s outliers':
      '%% \u0111i\u1EC3m d\u1EEF li\u1EC7u c\u01A1 s\u1EDF n\u1EB1m ngo\xE0i %(outlierType)s',
    '%% of facility data points that are %(outlierType)s outliers by %(geography)s':
      '%% \u0111i\u1EC3m d\u1EEF li\u1EC7u c\u01A1 s\u1EDF l\xE0 %(outlierType)s ngo\u1EA1i l\u1EC7 theo %(geography)s',
    '%% of reported values that are outliers':
      '%% gi\xE1 tr\u1ECB \u0111\u01B0\u1EE3c b\xE1o c\xE1o l\xE0 gi\xE1 tr\u1ECB ngo\u1EA1i l\u1EC7',
    '%(numReports)s reports have been received from %(numFacilities)s facilities since %(firstReportDate)s_':
      'B\xE1o c\xE1o %(numReports)s \u0111\xE3 \u0111\u01B0\u1EE3c nh\u1EADn t\u1EEB c\xE1c c\u01A1 s\u1EDF %(numFacilities)s k\u1EC3 t\u1EEB %(firstReportDate)s.',
    'All (2+ stdev from mean)':
      'T\u1EA5t c\u1EA3 (2+ stdev t\u1EEB trung b\xECnh)',
    'Box Plot': 'Box plot',
    'Click to view reported data & outliers on time series below':
      'Nh\u1EA5p \u0111\u1EC3 xem d\u1EEF li\u1EC7u v\xE0 ngo\u1EA1i l\u1EC7 \u0111\u01B0\u1EE3c b\xE1o c\xE1o tr\xEAn chu\u1ED7i th\u1EDDi gian b\xEAn d\u01B0\u1EDBi',
    'Data Outlier Analysis Score Explanation':
      'Gi\u1EA3i th\xEDch v\u1EC1 \u0111i\u1EC3m ph\xE2n t\xEDch d\u1EEF li\u1EC7u Outlier',
    'Each dot on the box plot represents the %% of reported values that are outliers for a single facility_':
      'M\u1ED7i d\u1EA5u ch\u1EA5m tr\xEAn bi\u1EC3u \u0111\u1ED3 h\u1ED9p \u0111\u1EA1i di\u1EC7n cho %% c\xE1c gi\xE1 tr\u1ECB \u0111\u01B0\u1EE3c b\xE1o c\xE1o l\xE0 gi\xE1 tr\u1ECB ngo\u1EA1i l\u1EC7 cho m\u1ED9t c\u01A1 s\u1EDF.',
    'Extreme (3+ stdev from mean)': 'C\u1EF1c (3+ stdev t\u1EEB trung b\xECnh)',
    'Investigate Outliers':
      '\u0110i\u1EC1u tra d\u1EEF li\u1EC7u ngo\xE0i l\u1EC1',
    'Moderate (2-3 stdev from mean)':
      'Trung b\xECnh (2-3 stdev t\u1EEB trung b\xECnh)',
    'Note that for indicators with strong seasonality, there will be a higher proportion of outlier data points by definition and this may not mean there are actual data quality issues_':
      'L\u01B0u \xFD r\u1EB1ng \u0111\u1ED1i v\u1EDBi c\xE1c ch\u1EC9 s\u1ED1 c\xF3 t\xEDnh th\u1EDDi v\u1EE5 cao, theo \u0111\u1ECBnh ngh\u0129a s\u1EBD c\xF3 t\u1EF7 l\u1EC7 \u0111i\u1EC3m d\u1EEF li\u1EC7u ngo\u1EA1i l\u1EC7 cao h\u01A1n v\xE0 \u0111i\u1EC1u n\xE0y c\xF3 th\u1EC3 kh\xF4ng c\xF3 ngh\u0129a l\xE0 c\xF3 v\u1EA5n \u0111\u1EC1 v\u1EC1 ch\u1EA5t l\u01B0\u1EE3ng d\u1EEF li\u1EC7u th\u1EF1c t\u1EBF.',
    'Note that the mean value for each facility is calculated using all historical data, even if you have a time filter set_ Options to choose dates to exclude from this calculation are coming soon and will be found here_':
      'L\u01B0u \xFD r\u1EB1ng gi\xE1 tr\u1ECB trung b\xECnh cho m\u1ED7i c\u01A1 s\u1EDF \u0111\u01B0\u1EE3c t\xEDnh to\xE1n b\u1EB1ng c\xE1ch s\u1EED d\u1EE5ng t\u1EA5t c\u1EA3 d\u1EEF li\u1EC7u l\u1ECBch s\u1EED, ngay c\u1EA3 khi b\u1EA1n c\xF3 b\u1ED9 l\u1ECDc th\u1EDDi gian. C\xE1c t\xF9y ch\u1ECDn \u0111\u1EC3 ch\u1ECDn ng\xE0y \u0111\u1EC3 lo\u1EA1i tr\u1EEB kh\u1ECFi t\xEDnh to\xE1n n\xE0y s\u1EAFp ra m\u1EAFt v\xE0 s\u1EBD \u0111\u01B0\u1EE3c t\xECm th\u1EA5y \u1EDF \u0111\xE2y.',
    'Outlier type': 'Lo\u1EA1i ngo\u1EA1i l\u1EC7',
    'Proportion of facility data points that are extreme outliers:':
      'T\u1EF7 l\u1EC7 c\xE1c \u0111i\u1EC3m d\u1EEF li\u1EC7u c\u01A1 s\u1EDF l\xE0 c\u1EF1c k\u1EF3 ngo\u1EA1i l\u1EC7:',
    'Proportion that are moderate outliers:':
      'T\u1EF7 l\u1EC7 ngo\u1EA1i l\u1EC7 v\u1EEBa ph\u1EA3i:',
    'Reporting Period': 'K\u1EF3 b\xE1o c\xE1o',
    'Reports Received': 'B\xE1o c\xE1o \u0111\xE3 nh\u1EADn',
    "This tool identifies data points that are extreme outliers (3+ standard deviations from the mean) and moderate outliers (2-3 standard deviations) relative to a facility's historical mean_ The higher the average proportion of outliers, the worse it is for the quality score_":
      'C\xF4ng c\u1EE5 n\xE0y x\xE1c \u0111\u1ECBnh c\xE1c \u0111i\u1EC3m d\u1EEF li\u1EC7u l\xE0 gi\xE1 tr\u1ECB ngo\u1EA1i l\u1EC7 c\u1EF1c \u0111\u1ED9 (3+ \u0111\u1ED9 l\u1EC7ch chu\u1EA9n so v\u1EDBi gi\xE1 tr\u1ECB trung b\xECnh) v\xE0 gi\xE1 tr\u1ECB ngo\u1EA1i l\u1EC7 v\u1EEBa ph\u1EA3i (2-3 \u0111\u1ED9 l\u1EC7ch chu\u1EA9n) so v\u1EDBi gi\xE1 tr\u1ECB trung b\xECnh l\u1ECBch s\u1EED c\u1EE7a c\u01A1 s\u1EDF. T\u1EF7 l\u1EC7 ngo\u1EA1i l\u1EC7 trung b\xECnh c\xE0ng cao th\xEC \u0111i\u1EC3m ch\u1EA5t l\u01B0\u1EE3ng c\xE0ng k\xE9m.',
    'This tool is intended to help you isolate data points which are outliers relative to the mean for each facility_':
      'C\xF4ng c\u1EE5 n\xE0y nh\u1EB1m gi\xFAp b\u1EA1n t\xE1ch bi\u1EC7t c\xE1c \u0111i\u1EC3m d\u1EEF li\u1EC7u ngo\u1EA1i l\u1EC7 so v\u1EDBi gi\xE1 tr\u1ECB trung b\xECnh cho m\u1ED7i c\u01A1 s\u1EDF.',
    "You can click on each dot to view that facility's data on a time series below and see which datapoints are outliers relative to the mean_ Some of the outliers may be erroneous and require follow up with the facility to understand & resolve_":
      'B\u1EA1n c\xF3 th\u1EC3 nh\u1EA5p v\xE0o t\u1EEBng d\u1EA5u ch\u1EA5m \u0111\u1EC3 xem d\u1EEF li\u1EC7u c\u1EE7a c\u01A1 s\u1EDF \u0111\xF3 tr\xEAn m\u1ED9t chu\u1ED7i th\u1EDDi gian b\xEAn d\u01B0\u1EDBi v\xE0 xem \u0111i\u1EC3m d\u1EEF li\u1EC7u n\xE0o l\xE0 ngo\u1EA1i l\u1EC7 so v\u1EDBi gi\xE1 tr\u1ECB trung b\xECnh. M\u1ED9t s\u1ED1 ngo\u1EA1i l\u1EC7 c\xF3 th\u1EC3 c\xF3 sai s\xF3t v\xE0 y\xEAu c\u1EA7u li\xEAn h\u1EC7 v\u1EDBi c\u01A1 s\u1EDF \u0111\u1EC3 hi\u1EC3u v\xE0 gi\u1EA3i quy\u1EBFt.',
  },
  am: {
    Mean: '\u121A\u1295',
    Table: '\u1320\u1228\u1334\u12DB',
    extreme: 'ጽንፈኛ',
    extremeLowerBound:
      '\u12A5\u1305\u130D \u1260\u1323\u121D (3+ stdev from mean) \u1260\u1323\u121D \u12DD\u1245\u1270\u129B \u12DD\u1245\u1270\u129B \u12C8\u1230\u1295',
    extremeUpperBound:
      '\u12A5\u1305\u130D \u1260\u1323\u121D (3+ stdev from mean) \u1260\u120B\u12ED\u129B\u12CD \u12C8\u1230\u1295',
    moderate: 'መጠነኛ',
    noFacilitySelectedExplanation:
      '\u12E8\u1270\u124B\u1219\u1295 \u12F3\u1273 \u12A5\u12DA\u1205 \u121D\u120D\u12AD\u1275 \u12AB\u12F0\u1228\u1309\u1260\u1275 \u12CD\u132A \u1208\u121B\u12E8\u1275 \u12A8\u120B\u12ED \u1263\u1208\u12CD \u1233\u1325\u1295 \u120B\u12ED \u12EB\u1208\u12CD\u1295 \u12E8\u12CD\u1202\u1265 \u1290\u1325\u1265 \u1320\u1245 \u12EB\u12F5\u122D\u1309',
    noFacilitySelectedTitle:
      '\u121D\u1295\u121D \u1218\u1308\u120D\u1308\u12EB \u12A0\u120D\u1270\u1218\u1228\u1320\u121D\u1362',
    outlierLowerBound:
      '\u1218\u1320\u1290\u129B (2+ stdev from mean) \u1260\u1323\u121D \u12DD\u1245\u1270\u129B \u12DD\u1245\u1270\u129B \u12C8\u1230\u1295',
    outlierUpperBound:
      '\u1218\u1320\u1290\u129B (2+ stdev from mean) \u1260\u120B\u12ED\u129B\u12CD \u12C8\u1230\u1295',
    '# All Reports': '# ሁሉም ዘገባዎች',
    '# Outlier Reports': '# የውጪ ሪፖርቶች',
    '%% Outlier Reports': '%% የውጪ ሪፖርቶች',
    '%% of facility data points that are %(outlierType)s outliers':
      '\u12A8%(outlierType)s \u12CD\u132A \u12E8\u1206\u1291 \u12E8\u134B\u1232\u120A\u1272 \u1218\u1228\u1303 \u1290\u1325\u1266\u127D %%',
    '%% of facility data points that are %(outlierType)s outliers by %(geography)s':
      '\u12A8%(outlierType)s \u1260%(geography)s \u12CD\u132A \u12E8\u1206\u1291 \u12E8\u134B\u1232\u120A\u1272 \u1218\u1228\u1303 \u1290\u1325\u1266\u127D %%',
    '%% of reported values that are outliers': 'ከሪፖርት ዋጋ በላይ የሆኑ %%',
    '%(numReports)s reports have been received from %(numFacilities)s facilities since %(firstReportDate)s_':
      '\u12E8%(numReports)s \u122A\u1356\u122D\u1276\u127D \u12A8%(numFacilities)s \u1270\u124B\u121B\u1275 \u12A8%(firstReportDate)s \u1300\u121D\u122E \u1270\u1240\u1265\u1208\u12CB\u120D\u1362',
    'All (2+ stdev from mean)':
      '\u1201\u1209\u121D (2+ stdev \u12A8\u12A0\u121B\u12AB\u12ED)',
    'Box Plot': '\u1266\u12AD\u1235 \u1355\u120E\u1275',
    'Click to view reported data & outliers on time series below':
      'ከዚህ በታች በተዘረዘሩት የጊዜ ቅደም ተከተሎች ላይ የተዘገበ ዳታን ለማየት ጠቅ ያድርጉ',
    'Data Outlier Analysis Score Explanation':
      '\u12E8\u12F3\u1273 Outlier \u1275\u1295\u1270\u1293 \u12E8\u12CD\u1324\u1275 \u121B\u1265\u122B\u122A\u12EB',
    'Each dot on the box plot represents the %% of reported values that are outliers for a single facility_':
      'በሣጥኑ ቦታ ላይ ያለው እያንዳንዱ ነጥብ ለአንድ ፋሲሊቲ ውጪ የሆኑትን %% ሪፖርት ያደረጉ ዋጋዎችን ይወክላል።',
    'Extreme (3+ stdev from mean)':
      '\u133D\u1295\u134D (\u12A8\u12A0\u121B\u12AB\u129D 3+ stdev)',
    'Investigate Outliers': 'Outliers \u1218\u122D\u121D\u122D',
    'Moderate (2-3 stdev from mean)':
      '\u1218\u1320\u1290\u129B (2-3 stdev \u12A8\u12A0\u121B\u12AB\u12ED)',
    'Note that for indicators with strong seasonality, there will be a higher proportion of outlier data points by definition and this may not mean there are actual data quality issues_':
      'ጠንካራ ወቅታዊነት ላላቸው አመላካቾች በትርጉሙ ከፍተኛ መጠን ያለው የውጪ ዳታ ነጥቦች እንደሚኖሩ ልብ ይበሉ እና ይህ ማለት ትክክለኛ የዳታ ጥራት ችግሮች አሉ ማለት ላይሆን ይችላል።',
    'Note that the mean value for each facility is calculated using all historical data, even if you have a time filter set_ Options to choose dates to exclude from this calculation are coming soon and will be found here_':
      'የጊዜ ማጣሪያ ስብስብ ቢኖርዎትም የእያንዳንዱ ተቋም አማካኝ ዋጋ ሁሉንም ታሪካዊ መረጃዎችን በመጠቀም እንደሚሰላ ልብ ይበሉ። ከዚህ ስሌት የሚገለሉበትን ቀኖች ለመምረጥ አማራጮች በቅርቡ ይመጣሉ እና እዚህ ይገኛሉ።',
    'Outlier type': 'ውጫዊ ዓይነት',
    'Proportion of facility data points that are extreme outliers:':
      'እጅግ በጣም ውጫዊ የሆኑ የመገልገያ ዳታ ነጥቦች መጠን፡-',
    'Proportion that are moderate outliers:': 'መጠነኛ ውጫዊ የሆኑ መጠን፡',
    'Reporting Period':
      '\u12E8\u122A\u1356\u122D\u1275 \u121B\u1245\u1228\u1262\u12EB \u130A\u12DC',
    'Reports Received':
      '\u122A\u1356\u122D\u1276\u127D \u12F0\u122D\u1230\u12CB\u120D',
    "This tool identifies data points that are extreme outliers (3+ standard deviations from the mean) and moderate outliers (2-3 standard deviations) relative to a facility's historical mean_ The higher the average proportion of outliers, the worse it is for the quality score_":
      'ይህ መሳሪያ ከተቋሙ ታሪካዊ አማካኝ አንፃር እጅግ በጣም ውጫዊ የሆኑ (3+ መደበኛ ልዩነቶች ከአማካይ) እና መጠነኛ ውጪ የሆኑ (2-3 መደበኛ ልዩነቶች) የዳታ ነጥቦችን ይለያል። የውጪዎቹ አማካኝ መጠን ከፍ ባለ መጠን ለጥራት ውጤቱ የከፋ ነው።',
    'This tool is intended to help you isolate data points which are outliers relative to the mean for each facility_':
      'ይህ መሳሪያ ከእያንዳንዱ ፋሲሊቲ አማካኝ አንፃር ወጣ ያሉ የዳታ ነጥቦችን እንዲለዩ ለመርዳት የታሰበ ነው።',
    "You can click on each dot to view that facility's data on a time series below and see which datapoints are outliers relative to the mean_ Some of the outliers may be erroneous and require follow up with the facility to understand & resolve_":
      'የተቋሙን መረጃ ከታች ባለው ተከታታይ ጊዜ ለማየት በእያንዳንዱ ነጥብ ላይ ጠቅ ማድረግ እና የትኛዎቹ የመረጃ ነጥቦች ከአማካይ አንፃር ተቃራኒዎች እንደሆኑ ለማየት ይችላሉ። አንዳንድ ውጫዊ ገጽታዎች የተሳሳቱ ሊሆኑ ይችላሉ እና ለመረዳት እና ለመፍታት በተቋሙ ላይ ክትትል ያስፈልጋቸዋል።',
  },
  fr: {
    Mean: 'Moyenne',
    Table: 'Tableau',
    extreme: 'extrême',
    extremeLowerBound:
      'Limite inf\xE9rieure de la valeur aberrante extr\xEAme (3+ \xE9cart type \xE0 partir de la moyenne)',
    extremeUpperBound:
      'Limite sup\xE9rieure de la valeur aberrante extr\xEAme (3+ \xE9cart type \xE0 partir de la moyenne)',
    moderate: 'modérée',
    noFacilitySelectedExplanation:
      'Cliquez sur un point de donn\xE9es sur la bo\xEEte \xE0 moustaches ci-dessus pour afficher les donn\xE9es de cette installation avec les valeurs aberrantes marqu\xE9es ici',
    noFacilitySelectedTitle: 'Aucune installation s\xE9lectionn\xE9e',
    outlierLowerBound:
      'Limite inf\xE9rieure de la valeur aberrante mod\xE9r\xE9e (2+ \xE9cart type par rapport \xE0 la moyenne)',
    outlierUpperBound:
      'Limite sup\xE9rieure de la valeur aberrante mod\xE9r\xE9e (2+ \xE9cart type par rapport \xE0 la moyenne)',
    '# All Reports': '# Tous les rapports',
    '# Outlier Reports': '# Rapports sur les valeurs aberrantes',
    '%% Outlier Reports': '%% Rapports sur les valeurs aberrantes',
    '%% of facility data points that are %(outlierType)s outliers':
      "%% des points de donn\xE9es de l'\xE9tablissement qui sont %(outlierType)s aberrants",
    '%% of facility data points that are %(outlierType)s outliers by %(geography)s':
      '%% des points de donn\xE9es des \xE9tablissements qui sont %(outlierType)s aberrants par %(geography)s',
    '%% of reported values that are outliers':
      '%% des valeurs rapport\xE9es qui sont des valeurs aberrantes',
    '%(numReports)s reports have been received from %(numFacilities)s facilities since %(firstReportDate)s_':
      '%(numReports)s rapports ont \xE9t\xE9 re\xE7us de %(numFacilities)s \xE9tablissements depuis le %(firstReportDate)s.',
    'All (2+ stdev from mean)': 'Tous (2+ dévstd par rapport à la moyenne)',
    'Box Plot': 'Bo\xEEte \xE0 moustaches',
    'Click to view reported data & outliers on time series below':
      'Cliquez pour afficher les donn\xE9es rapport\xE9es et les valeurs aberrantes sur les s\xE9ries chronologiques ci-dessous',
    'Data Outlier Analysis Score Explanation':
      'Explication du score de l’analyse des valeurs aberrantes',
    'Each dot on the box plot represents the %% of reported values that are outliers for a single facility_':
      'Chaque point sur la bo\xEEte \xE0 moustaches repr\xE9sente le %% des valeurs rapport\xE9es qui sont des valeurs aberrantes pour un seul \xE9tablissement.',
    'Extreme (3+ stdev from mean)':
      'Extrême (3+ dévstd par rapport à la moyenne)',
    'Investigate Outliers': 'Enquêter sur les valeurs aberrantes',
    'Moderate (2-3 stdev from mean)':
      'Modéré (2-3 dévstd  par rapport à la moyenne)',
    'Note that for indicators with strong seasonality, there will be a higher proportion of outlier data points by definition and this may not mean there are actual data quality issues_':
      'Il est à noter que pour les indicateurs à forte saisonnalité, il aura une proportion plus élevée de points de données aberrants par définition, ce qui peut ne pas signifier qu’il y a des problèmes réels de qualité des données.',
    'Note that the mean value for each facility is calculated using all historical data, even if you have a time filter set_ Options to choose dates to exclude from this calculation are coming soon and will be found here_':
      'Veuillez noter que la valeur moyenne de chaque installation est calculée à l’aide de toutes les données historiques, même si vous disposez d’un filtre temporel. Les options pour choisir les dates à exclure de ce calcul seront bientôt disponibles ici.',
    'Outlier type': 'Type de valeur aberrante',
    'Proportion of facility data points that are extreme outliers:':
      'Proportion de points de données sur les installations qui sont des valeurs aberrantes extrêmes :',
    'Proportion that are moderate outliers:':
      'Proportion des valeurs aberrantes modérées :',
    'Reporting Period': 'P\xE9riode de d\xE9claration',
    'Reports Received': 'Rapports reçus',
    "This tool identifies data points that are extreme outliers (3+ standard deviations from the mean) and moderate outliers (2-3 standard deviations) relative to a facility's historical mean_ The higher the average proportion of outliers, the worse it is for the quality score_":
      'Cet outil identifie les points de données qui sont des valeurs aberrantes extrêmes (3+ écarts-types par rapport à la moyenne) et des valeurs aberrantes modérées (2-3 écarts-types) par rapport à la moyenne historique d’une installation. Plus la proportion moyenne des valeurs aberrantes est élevée, pire est la note de qualité.',
    'This tool is intended to help you isolate data points which are outliers relative to the mean for each facility_':
      'Cet outil vise à vous aider à isoler les points de données qui sont des valeurs aberrantes par rapport à la moyenne pour chaque installation.',
    "You can click on each dot to view that facility's data on a time series below and see which datapoints are outliers relative to the mean_ Some of the outliers may be erroneous and require follow up with the facility to understand & resolve_":
      'Vous pouvez cliquer sur chaque point pour afficher les données de cette installation sur une série chronologique ci-dessous et voir quels points de données sont des valeurs aberrantes par rapport à la moyenne. Certaines des valeurs aberrantes peuvent être erronées et nécessitent un suivi auprès de l’installation pour comprendre et résoudre.',
  },
  br: {
    Mean: 'M\xE9dia',
    Table: 'Tabela',
    extreme: 'extremo',
    extremeLowerBound:
      'Extremo (3+ stdev a partir da m\xE9dia) limite inferior',
    extremeUpperBound:
      'Extremo (3+ stdev a partir da m\xE9dia) limite superior anterior',
    moderate: 'moderado',
    noFacilitySelectedExplanation:
      'Clique em um ponto de dados no gráfico de caixa/extremo acima para visualizar os dados dessa instalação com outliers marcados aqui',
    noFacilitySelectedTitle: 'Nenhuma instalação selecionada',
    outlierLowerBound:
      'Moderado (2+ stdev a partir da m\xE9dia) limite inferior anterior',
    outlierUpperBound:
      'Moderado (2+ stdev da m\xE9dia) limite superior anterior',
    '# All Reports': '# Todos os relat\xF3rios',
    '# Outlier Reports': '# Relat\xF3rios anteriores',
    '%% Outlier Reports': '%% Relat\xF3rios anteriores',
    '%% of facility data points that are %(outlierType)s outliers':
      '%% de dados de instalações que são %(outlierType)s outliers',
    '%% of facility data points that are %(outlierType)s outliers by %(geography)s':
      '%% de dados de instalações que são %(outlierType)s outliers por %(geography)s',
    '%% of reported values that are outliers':
      '%% dos valores reportados que s\xE3o aberrantes',
    '%(numReports)s reports have been received from %(numFacilities)s facilities since %(firstReportDate)s_':
      'Relat\xF3rios de %(numReports)s foram recebidos de %(numFacilities)s instala\xE7\xF5es desde %(firstReportDate)s.',
    'All (2+ stdev from mean)': 'Todos (2+ stdev da média)',
    'Box Plot': 'Diagrama de caixa',
    'Click to view reported data & outliers on time series below':
      'Clique para ver os dados reportados e os outliers das s\xE9ries cronol\xF3gicas abaixo',
    'Data Outlier Analysis Score Explanation':
      'Explicação da Pontuação das Análises de Outliers',
    'Each dot on the box plot represents the %% of reported values that are outliers for a single facility_':
      'Cada ponto no boxplot representa a %% dos valores relatados que são valores atípicos para uma única instalação.',
    'Extreme (3+ stdev from mean)': 'Extrema (3+ stdev da média)',
    'Investigate Outliers': 'Investigar Outliers',
    'Moderate (2-3 stdev from mean)': 'Moderada (2-3 stdev da média)',
    'Note that for indicators with strong seasonality, there will be a higher proportion of outlier data points by definition and this may not mean there are actual data quality issues_':
      'Note que para os indicadores com forte sazonalidade, haverá uma maior proporção de outliers, por definição, e isso pode não significar que hajam questões reais de qualidade de dados.',
    'Note that the mean value for each facility is calculated using all historical data, even if you have a time filter set_ Options to choose dates to exclude from this calculation are coming soon and will be found here_':
      'Note que o valor médio para cada instalação é calculada usando todos os dados históricos, mesmo se você tiver um conjunto de filtros de tempo. Opções para escolher datas para serem excluidas desse cálculo estão chegando em breve e vai ser encontrada aqui.',
    'Outlier type': 'Tipo de Outlier',
    'Proportion of facility data points that are extreme outliers:':
      'Proporção de pontos de dados que são valores atípicos extremos:',
    'Proportion that are moderate outliers:':
      'Proporção que são valores atípicos moderados:',
    'Reporting Period': 'Per\xEDodo de relat\xF3rio',
    'Reports Received': 'Relatórios Recebidos',
    "This tool identifies data points that are extreme outliers (3+ standard deviations from the mean) and moderate outliers (2-3 standard deviations) relative to a facility's historical mean_ The higher the average proportion of outliers, the worse it is for the quality score_":
      'Esta ferramenta identifica pontos que são valores atípicos extremos (3 + desvios padrão da média) e outliers moderadas (2-3 desvios padrão) em relação à média histórica de uma instalação. Quanto maior a proporção média de outliers, pior é para o índice de qualidade.',
    'This tool is intended to help you isolate data points which are outliers relative to the mean for each facility_':
      'Esta ferramenta se destina a ajudar a isolar pontos de dados que são discrepantes em relação à média para cada instalação.',
    "You can click on each dot to view that facility's data on a time series below and see which datapoints are outliers relative to the mean_ Some of the outliers may be erroneous and require follow up with the facility to understand & resolve_":
      'Você pode clicar em cada ponto para ver os dados de cada instalação em uma série de tempo e ver quais pontos de dados são discrepantes em relação à média. Alguns dos valores atípicos podem ser incorrectos e exigem acompanhamento com a instalação.',
  },
};
export default translations;
