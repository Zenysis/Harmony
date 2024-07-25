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
    dataprepDescription:
      'In order to successfully ingest your data into our database, data column names and order must match your original data recipe:',
    fileNotMatched: 'The uploaded file did not match the required format.',
    locationInfo: 'The expected dataset location folder is below.',
    noHeadersDetected:
      'There were no headers detected in the original source file.',
    recipeInfo:
      'The recipe ID is a number that can be found in Dataprep. Click on the last recipe step before the output and use the "recipe" ID in that URL.',
    sourceDropdownInfo:
      'Dataprep self-serve sources require an existing pipeline step. Select one from the list below; items are listed as "Name (Source ID)".',
    updateTypeInfo:
      'Update Type is set in Dataprep. Flows with parameterized input datasets are of "Append new files" type, while flows with a single input file are of "Replace entire dataset" type.\nThis option cannot be toggled here and must be done in Dataprep.',
    '%(columnsCount)s column(s)': '%(columnsCount)s column(s)',
    '<source ID>': '<source ID>',
    'Append new files': 'Append new files',
    'Dataprep Flow must have one input dataset in expected folder_':
      'Dataprep Flow must have one input dataset in expected folder.',
    'Dataprep recipe ID does not exist_': 'Dataprep recipe ID does not exist.',
    'Dataprep recipe ID is not the last recipe ID in Flow_':
      'Dataprep recipe ID is not the last recipe ID in Flow.',
    'Date uploaded': 'Date uploaded',
    'Error downloading file': 'Error downloading file',
    'Existing Files (%(numberFiles)s)': 'Existing Files (%(numberFiles)s)',
    'Existing Source': 'Existing Source',
    'File name': 'File name',
    'Location Folder': 'Location Folder',
    'Location folder does not exist in the cloud_':
      'Location folder does not exist in the cloud.',
    'Location folder must contain a single `self_serve_input` file_':
      'Location folder must contain a single `self_serve_input` file.',
    'Location folder must contain files with the same extension_':
      'Location folder must contain files with the same extension.',
    'Looks like the Upload failed': 'Looks like the Upload failed',
    'No headers to validate': 'No headers to validate',
    'No valid input files found in location folder_':
      'No valid input files found in location folder.',
    'Parameterized Dataprep dataset does not have the expected path_':
      'Parameterized Dataprep dataset does not have the expected path.',
    'Recipe ID': 'Recipe ID',
    'Replace entire dataset': 'Replace entire dataset',
    'See full list of column names': 'See full list of column names',
    'Select a source': 'Select a source',
    'The files that appear below are the current Dataprep inputs_ When the Dataprep job is run, these files are merged and processed through the Dataprep recipe_':
      'The files that appear below are the current Dataprep inputs. When the Dataprep job is run, these files are merged and processed through the Dataprep recipe.',
    'There are no uploaded input files_': 'There are no uploaded input files.',
    'Try again': 'Try again',
    'Update Type': 'Update Type',
    'Update Type is fetched from Dataprep based on Recipe ID':
      'Update Type is fetched from Dataprep based on Recipe ID',
    'Upload columns are out of order_ Expected order:':
      'Upload columns are out of order. Expected order:',
    'Upload contains these additional columns:':
      'Upload contains these additional columns:',
    'Upload is missing these required columns:':
      'Upload is missing these required columns:',
    'You can download the existing input files below to see what format new files must adhere to_ You may also remove files, which will have the effect of removing files from cloud storage_':
      'You can download the existing input files below to see what format new files must adhere to. You may also remove files, which will have the effect of removing files from cloud storage.',
    'dataprep-disabled-source-name': 'Dataprep source names cannot be edited.',
    'delete file': 'delete file',
    'download file': 'download file',
  },
  pt: {
    dataprepDescription:
      'A fim de ingerir com sucesso seus dados em nosso banco de dados, os nomes das colunas de dados devem corresponder \xE0 sua receita de dados original:',
    fileNotMatched:
      'O arquivo carregado n\xE3o correspondeu ao formato exigido.',
    locationInfo:
      'A pasta de localiza\xE7\xE3o do conjunto de dados esperado est\xE1 abaixo.',
    noHeadersDetected:
      'N\xE3o foram detectados cabe\xE7alhos no arquivo de origem original.',
    recipeInfo:
      'A identifica\xE7\xE3o da receita \xE9 um n\xFAmero que pode ser encontrado na URL do dataprep. Clique na \xFAltima etapa da receita antes da sa\xEDda e use essa identifica\xE7\xE3o.',
    sourceDropdownInfo:
      'As fontes de autoatendimento dataprep requerem uma etapa de pipeline existente. Selecione uma da lista abaixo; os itens s\xE3o listados como "Nome (Identifica\xE7\xE3o da Fonte)".',
    updateTypeInfo:
      'O tipo de actualiza\xE7\xE3o est\xE1 definido no DataPrep. Os fluxos com conjuntos de dados de entrada parametrizados s\xE3o do tipo "Anexar novos ficheiros", enquanto os fluxos com um \xFAnico ficheiro de entrada s\xE3o de "Substituir o tipo de conjunto de dados inteiro".\nEsta op\xE7\xE3o n\xE3o pode ser alterada aqui e deve ser feita no DataPrep.',
    '%(columnsCount)s column(s)': '%(columnsCount)s coluna(s)',
    '<source ID>': '<identifica\xE7\xE3o da fonte>',
    'Append new files': 'Anexar novos ficheiros',
    'Dataprep Flow must have one input dataset in expected folder_': '',
    'Dataprep recipe ID does not exist_': '',
    'Dataprep recipe ID is not the last recipe ID in Flow_': '',
    'Date uploaded': 'Data do upload',
    'Error downloading file': 'Erro ao baixar o ficheiro',
    'Existing Files (%(numberFiles)s)':
      'Ficheiros existentes (%(numberFiles)s)',
    'Existing Source': 'Fonte Existente',
    'File name': 'Nome do ficheiro',
    'Location Folder': 'Localiza\xE7\xE3o da pasta',
    'Location folder does not exist in the cloud_': '',
    'Location folder must contain a single `self_serve_input` file_': '',
    'Location folder must contain files with the same extension_': '',
    'Looks like the Upload failed': 'Parece que o Upload falhou',
    'No headers to validate': 'Sem cabe\xE7alhos para validar',
    'No valid input files found in location folder_': '',
    'Parameterized Dataprep dataset does not have the expected path_': '',
    'Recipe ID': 'Id da receita',
    'Replace entire dataset': 'Substitua todo conjunto de dados',
    'See full list of column names':
      'Veja a lista completa dos nomes das colunas',
    'Select a source': 'Selecione uma fonte',
    'The files that appear below are the current Dataprep inputs_ When the Dataprep job is run, these files are merged and processed through the Dataprep recipe_':
      'Os ficheiros que aparecem abaixo s\xE3o as entradas actuais do Dataprep. Quando o Dataprep \xE9 executado, esses ficheiros s\xE3o mesclados e processados por meio da receita do Dataprep.',
    'There are no uploaded input files_':
      'N\xE3o h\xE1 ficheiros de entrada carregados.',
    'Try again': 'Tente novamente',
    'Update Type': 'Tipo de actualiza\xE7\xE3o',
    'Update Type is fetched from Dataprep based on Recipe ID':
      'Tipo de actualiza\xE7\xE3o foi buscado no dataprep com base no ID do recipiente',
    'Upload columns are out of order_ Expected order:': '',
    'Upload contains these additional columns:': '',
    'Upload is missing these required columns:': '',
    'You can download the existing input files below to see what format new files must adhere to_ You may also remove files, which will have the effect of removing files from cloud storage_':
      'Pode baixar os ficheiros de entrada existentes abaixo para ver o formato ao qual os novos ficheiros devem aderir. Tamb\xE9m pode remover arquivos, o que ir\xE1 remover of cheiros do armazenamento na n\xFAvem.',
    'dataprep-disabled-source-name': '',
    'delete file': 'Apagar ficheiro',
    'download file': 'Baixar ficheiro',
  },
  vn: {
    dataprepDescription:
      '\u0110\u1EC3 nh\u1EADp th\xE0nh c\xF4ng d\u1EEF li\u1EC7u c\u1EE7a b\u1EA1n v\xE0o c\u01A1 s\u1EDF d\u1EEF li\u1EC7u c\u1EE7a ch\xFAng t\xF4i, t\xEAn v\xE0 th\u1EE9 t\u1EF1 c\xE1c c\u1ED9t d\u1EEF li\u1EC7u ph\u1EA3i kh\u1EDBp v\u1EDBi c\xF4ng th\u1EE9c d\u1EEF li\u1EC7u ban \u0111\u1EA7u c\u1EE7a b\u1EA1n:',
    fileNotMatched:
      'T\u1EC7p \u0111\u01B0\u1EE3c t\u1EA3i l\xEAn kh\xF4ng ph\xF9 h\u1EE3p v\u1EDBi \u0111\u1ECBnh d\u1EA1ng \u0111\u01B0\u1EE3c y\xEAu c\u1EA7u.',
    locationInfo:
      'Th\u01B0 m\u1EE5c v\u1ECB tr\xED c\u1EE7a b\u1ED9 d\u1EEF li\u1EC7u d\u1EF1 ki\u1EBFn \u1EDF ph\xEDa d\u01B0\u1EDBi',
    noHeadersDetected:
      'Kh\xF4ng c\xF3 ti\xEAu \u0111\u1EC1 n\xE0o \u0111\u01B0\u1EE3c ph\xE1t hi\u1EC7n trong t\u1EC7p ngu\u1ED3n ban \u0111\u1EA7u.',
    recipeInfo:
      'C\xF3 th\u1EC3 t\xECm th\u1EA5y recipe ID trong Dataprep. Nh\u1EA5p chu\u1ED9t v\xE0o b\u01B0\u1EDBc recipe cu\u1ED1i c\xF9ng tr\u01B0\u1EDBc \u0111\u1EA7u ra v\xE0 s\u1EED d\u1EE5ng "recipe" trong URL \u0111\xF3',
    sourceDropdownInfo:
      'C\xE1c ngu\u1ED3n t\u1EF1 ph\u1EE5c v\u1EE5 Dataprep y\xEAu c\u1EA7u m\u1ED9t b\u01B0\u1EDBc pipeline hi\u1EC7n c\xF3. Ch\u1ECDn m\u1ED9t t\u1EEB danh s\xE1ch d\u01B0\u1EDBi \u0111\xE2y; c\xE1c m\u1EE5c \u0111\u01B0\u1EE3c li\u1EC7t k\xEA l\xE0 "Name (Source Id)".',
    updateTypeInfo:
      'Lo\u1EA1i C\u1EADp nh\u1EADp \u0111\u01B0\u1EE3c c\xE0i \u0111\u1EB7t trong Dataprep. Nh\u1EEFng lu\u1ED3ng c\xF3 c\xE1c b\u1ED9 d\u1EEF li\u1EC7u \u0111\u1EA7u v\xE0o \u0111\u01B0\u1EE3c tham s\u1ED1 h\xF3a l\xE0 lo\u1EA1i  "N\u1ED1i th\xEAm file m\u1EDBi" trong khi nh\u1EEFng lu\u1ED3ng ch\u1EC9 c\xF3 m\u1ED9t file \u0111\u1EA7u v\xE0o duy nh\u1EA5t l\xE0 lo\u1EA1i "Ghi \u0111\xE8 to\xE0n b\u1ED9 d\u1EEF li\u1EC7u".\nKh\xF4ng th\u1EF1c hi\u1EC7n \u0111\u01B0\u1EE3c t\xF9y ch\u1ECDn n\xE0y t\u1EA1i \u0111\xE2y v\xE0 ph\u1EA3i l\xE0m t\u1EA1i Dataprep.',
    '%(columnsCount)s column(s)': '%(columnsCount)s (c\xE1c) c\u1ED9t',
    '<source ID>': '<id ngu\u1ED3n>',
    'Append new files': 'N\u1ED1i th\xEAm files m\u1EDBi',
    'Dataprep Flow must have one input dataset in expected folder_':
      'Dataprep Flow ph\u1EA3i c\xF3 m\u1ED9t d\u1EEF li\u1EC7u \u0111\u1EA7u v\xE0o trong th\u01B0 m\u1EE5c d\u1EF1 ki\u1EBFn',
    'Dataprep recipe ID does not exist_':
      'ID c\xF4ng th\u1EE9c Dataprep kh\xF4ng t\u1ED3n t\u1EA1i',
    'Dataprep recipe ID is not the last recipe ID in Flow_':
      'ID c\xF4ng th\u1EE9c Dataprep kh\xF4ng ph\u1EA3i l\xE0 ID c\xF4ng th\u1EE9c cu\u1ED1i c\xF9ng trong Flow',
    'Date uploaded': 'Ng\xE0y t\u1EA3i l\xEAn',
    'Error downloading file': 'L\u1ED7i t\u1EA3i xu\u1ED1ng d\u1EEF li\u1EC7u ',
    'Existing Files (%(numberFiles)s)':
      'C\xE1c file hi\u1EC7n c\xF3 (%(numberFiles)s)',
    'Existing Source': 'Ngu\u1ED3n hi\u1EC7n c\xF3',
    'File name': 'T\xEAn file',
    'Location Folder': 'Th\u01B0 m\u1EE5c v\u1ECB tr\xED',
    'Location folder does not exist in the cloud_':
      'Th\u01B0 m\u1EE5c v\u1ECB tr\xED kh\xF4ng t\u1ED3n t\u1EA1i trong \u0111\xE1m m\xE2y',
    'Location folder must contain a single `self_serve_input` file_':
      'Th\u01B0 m\u1EE5c v\u1ECB tr\xED ph\u1EA3i ch\u1EE9a m\u1ED9t t\u1EC7p `self_serve_input`',
    'Location folder must contain files with the same extension_':
      'Th\u01B0 m\u1EE5c v\u1ECB tr\xED ph\u1EA3i ch\u1EE9a c\xE1c t\u1EC7p c\xF3 c\xF9ng ph\u1EA7n m\u1EDF r\u1ED9ng',
    'Looks like the Upload failed':
      'C\xF3 v\u1EBB nh\u01B0 T\u1EA3i l\xEAn kh\xF4ng th\xE0nh c\xF4ng',
    'No headers to validate':
      'Kh\xF4ng c\xF3 ti\xEAu \u0111\u1EC1 \u0111\u1EC3 x\xE1c th\u1EF1c',
    'No valid input files found in location folder_':
      'Kh\xF4ng t\xECm th\u1EA5y c\xE1c t\u1EC7p \u0111\u1EA7u v\xE0o h\u1EE3p l\u1EC7 trong th\u01B0 m\u1EE5c v\u1ECB tr\xED',
    'Parameterized Dataprep dataset does not have the expected path_':
      'B\u1ED9 d\u1EEF li\u1EC7u Dataprep \u0111\u01B0\u1EE3c tham s\u1ED1 ho\xE1 kh\xF4ng c\xF3 \u0111\u01B0\u1EDDng d\u1EABn d\u1EF1 ki\u1EBFn',
    'Recipe ID': 'Id c\xF4ng th\u1EE9c',
    'Replace entire dataset':
      'Ghi \u0111\xE8 to\xE0n b\u1ED9 d\u1EEF li\u1EC7u',
    'See full list of column names':
      'Xem danh s\xE1ch \u0111\u1EA7y \u0111\u1EE7 c\xE1c t\xEAn c\u1ED9t',
    'Select a source': 'Ch\u1ECDn m\u1ED9t ngu\u1ED3n',
    'The files that appear below are the current Dataprep inputs_ When the Dataprep job is run, these files are merged and processed through the Dataprep recipe_':
      'C\xE1c files xu\u1EA5t hi\u1EC7n d\u01B0\u1EDBi \u0111\xE2y l\xE0 \u0111\u1EA7u v\xE0o Dataprep hi\u1EC7n t\u1EA1i. Khi Dataprep job kh\u1EDFi ch\u1EA1y, c\xE1c file n\xE0y s\u1EBD \u0111\u01B0\u1EE3c n\u1ED1i v\u1EDBi nhau v\xE0 \u0111\u01B0\u1EE3c x\u1EED l\xFD b\u1EB1ng c\xF4ng th\u1EE9c Dataprep',
    'There are no uploaded input files_':
      'Kh\xF4ng c\xF3 file \u0111\u1EA7u v\xE0o \u0111\u01B0\u1EE3c t\u1EA3i l\xEAn',
    'Try again': 'Th\u1EED l\u1EA1i',
    'Update Type': 'Lo\u1EA1i C\u1EADp nh\u1EADp',
    'Update Type is fetched from Dataprep based on Recipe ID':
      'Lo\u1EA1i C\u1EADp nh\u1EADp \u0111\u01B0\u1EE3c n\u1EA1p t\u1EEB Dataprep d\u1EF1a tr\xEAn Recipe ID',
    'Upload columns are out of order_ Expected order:':
      'C\xE1c c\u1ED9t t\u1EA3i l\xEAn kh\xF4ng \u0111\xFAng th\u1EE9 t\u1EF1. Th\u1EE9 t\u1EF1 d\u1EF1 ki\u1EBFn:',
    'Upload contains these additional columns:':
      'C\xE1c c\u1ED9t b\u1ED5 sung \u0111\u01B0\u1EE3c t\u1EA3i l\xEAn:',
    'Upload is missing these required columns:':
      'T\u1EA3i l\xEAn \u0111ang thi\u1EBFu c\xE1c c\u1ED9t b\u1EAFt bu\u1ED9c sau:',
    'You can download the existing input files below to see what format new files must adhere to_ You may also remove files, which will have the effect of removing files from cloud storage_':
      'B\u1EA1n c\xF3 th\u1EC3 t\u1EA3i xu\u1ED1ng c\xE1c file \u0111\u1EA7u v\xE0o hi\u1EC7n c\xF3 ph\xEDa d\u01B0\u1EDBi \u0111\u1EC3 xem \u0111\u1ECBnh d\u1EA1nh c\xE1c file m\u1EDBi c\u1EA7n tu\xE2n th\u1EE7. B\u1EA1n c\u0169ng c\xF3 th\u1EC3 x\xF3a file, nh\u01B0ng \u0111i\u1EC1u n\xE0y s\u1EBD g\xE2y \u1EA3nh h\u01B0\u1EDFng \u0111\u1EBFn vi\u1EC7c x\xF3a file t\u1EEB l\u01B0u tr\u1EEF \u0111\xE1m m\xE2y',
    'dataprep-disabled-source-name':
      'Kh\xF4ng th\u1EC3 ch\u1EC9nh s\u1EEDa t\xEAn ngu\u1ED3n Dataprep',
    'delete file': 'X\xF3a file',
    'download file': 'T\u1EA3i file xu\u1ED1ng',
  },
  am: {
    dataprepDescription:
      '\u12F3\u1273\u12CE\u1295 \u1260\u1270\u1233\u12AB \u1201\u1294\u1273 \u12C8\u12F0 \u12E8\u12F3\u1273 \u1264\u12DD\u1295 \u1208\u121B\u1235\u1308\u1263\u1275 \u12E8\u12F3\u1273 \u12D3\u121D\u12F5 \u1235\u121E\u127D \u12A8\u1218\u1300\u1218\u122A\u12EB\u12CD \u12E8\u12F3\u1273 \u12A0\u12D8\u1308\u1303\u1300\u1275\u12CE \u130B\u122D \u1218\u12DB\u1218\u12F5 \u12A0\u1208\u1263\u1278\u12CD\u1361-',
    fileNotMatched:
      '\u12E8\u1270\u132B\u1290\u12CD \u134B\u12ED\u120D \u12A8\u121A\u1348\u1208\u1308\u12CD \u1245\u122D\u1338\u1275 \u130B\u122D \u12A0\u120D\u1270\u12DB\u1218\u12F0\u121D\u1362',
    locationInfo:
      '\u12E8\u121A\u1320\u1260\u1240\u12CD \u12E8\u12F3\u1273 \u1235\u1265\u1235\u1265 \u1218\u1308\u129B \u12A0\u1243\u134A \u12A8\u1273\u127D \u1290\u12CD\u1362',
    noHeadersDetected:
      '\u1260\u1218\u1300\u1218\u122A\u12EB\u12CD \u12E8\u121D\u1295\u132D \u134B\u12ED\u120D \u12CD\u1235\u1325 \u121D\u1295\u121D \u1204\u12F0\u122D\u12CE\u127D \u12A0\u120D\u1270\u1308\u1299\u121D\u1362',
    recipeInfo:
      '\u12E8\u122C\u1230\u1352 \u1218\u1273\u12C8\u1242\u12EB \u1260dataprep url \u12CD\u1235\u1325 \u12E8\u121A\u1308\u129D \u1241\u1325\u122D \u1290\u12CD\u1362 \u12A8\u12CD\u1324\u1271 \u1260\u134A\u1275 \u12E8\u1218\u1328\u1228\u123B\u12CD\u1295 \u122C\u1230\u1352 \u12F0\u1228\u1303 \u12ED\u132B\u1291 \u12A5\u1293 \u1218\u1273\u12C8\u1242\u12EB\u12CD\u1295 \u12ED\u1320\u1240\u1219\u1362',
    sourceDropdownInfo:
      'Dataprep \u122B\u1235\u1295 \u12E8\u121A\u12EB\u1308\u1208\u130D\u1209 \u121D\u1295\u132E\u127D \u12A0\u1201\u1295 \u12EB\u1208 \u12E8pipeline \u12F0\u1228\u1303 \u12EB\u1235\u1348\u120D\u130B\u1278\u12CB\u120D\u1362 \u12A8\u1273\u127D \u12AB\u1208\u12CD \u12DD\u122D\u12DD\u122D \u12CD\u1235\u1325 \u12A0\u1295\u12F1\u1295 \u12ED\u121D\u1228\u1321; \u1295\u1325\u120E\u127D \u12A5\u1295\u12F0 "\u1235\u121D (\u121D\u1295\u132D \u1218\u1273\u12C8\u1242\u12EB)" \u1270\u12D8\u122D\u12DD\u1228\u12CB\u120D.',
    updateTypeInfo:
      '\u12E8\u12DD\u121B\u1294 \u12A0\u12ED\u1290\u1275 \u1260Dataprep \u12CD\u1235\u1325 \u1270\u1240\u121D\u1327\u120D\u1362 \u12A8\u1270\u1218\u1233\u1233\u12ED \u130D\u1264\u1275 \u12F3\u1273\u1234\u1276\u127D \u130B\u122D \u12E8\u121A\u1348\u1231\u1275 \u134D\u1230\u1276\u127D " \u12A0\u12F2\u1235 \u134B\u12ED\u120E\u127D\u1295 \u12A0\u12AD\u120D \u12D3\u12ED\u1290\u1275 \u1232\u1206\u1291 \u1290\u1320\u120B \u12E8\u130D\u1265\u12D3\u1275 \u134B\u12ED\u120D \u12EB\u120B\u1278\u12CD \u134D\u1230\u1276\u127D \u12F0\u130D\u121E "\u1219\u1209 \u12E8\u12F3\u1273 \u1235\u1265\u1235\u1265 \u1270\u12AB" \u12D3\u12ED\u1290\u1275 \u1293\u1278\u12CD\u1362\n\u12ED\u1205 \u12A0\u121B\u122B\u132D \u12A5\u12DA\u1205 \u1218\u1240\u12E8\u122D \u12A0\u12ED\u127B\u120D\u121D \u12A5\u1293 \u1260Dataprep \u12CD\u1235\u1325 \u1218\u12F0\u1228\u130D \u12A0\u1208\u1260\u1275\u1362',
    '%(columnsCount)s column(s)':
      '%(columnsCount)s \u12A0\u121D\u12F5(\u12CE\u127D)',
    '<source ID>': '<\u121D\u1295\u132D \u1218\u1273\u12C8\u1242\u12EB>',
    'Append new files':
      '\u12A0\u12F2\u1235 \u134B\u12ED\u120E\u127D\u1295 \u12A0\u12AD\u120D',
    'Dataprep Flow must have one input dataset in expected folder_':
      '\u12E8\u12F3\u1273 \u1355\u122A\u1355 \u134D\u1230\u1275 \u1260\u121A\u1320\u1260\u1240\u12CD \u12A0\u1243\u134A \u12CD\u1235\u1325 \u12A0\u1295\u12F5 \u12E8\u130D\u1264\u1275 \u12E8\u12F3\u1273 \u1235\u1265\u1235\u1265 \u120A\u1296\u1228\u12CD \u12ED\u1308\u1263\u120D\u1362',
    'Dataprep recipe ID does not exist_':
      '\u12E8\u12F3\u1273 \u1355\u122A\u1355  \u12E8\u12A0\u12D8\u1308\u1303\u1300\u1275 \u1218\u1273\u12C8\u1242\u12EB \u12E8\u1208\u121D\u1362',
    'Dataprep recipe ID is not the last recipe ID in Flow_':
      '\u12E8\u12F3\u1273 \u1355\u122A\u1355  \u12A0\u12D8\u1308\u1303\u1300\u1275 \u1218\u1273\u12C8\u1242\u12EB \u134D\u1230\u1275 \u12CD\u1235\u1325 \u12E8\u1218\u1328\u1228\u123B\u12CD \u12E8\u121D\u130D\u1265 \u12A0\u12D8\u1308\u1303\u1300\u1275 \u1218\u1273\u12C8\u1242\u12EB \u12A0\u12ED\u12F0\u1208\u121D.',
    'Date uploaded': '\u12E8\u1270\u132B\u1290\u1260\u1275 \u1240\u1295',
    'Error downloading file':
      '\u134B\u12ED\u120D \u121B\u12CD\u1228\u12F5 \u120B\u12ED \u1235\u1205\u1270\u1275',
    'Existing Files (%(numberFiles)s)':
      '\u1290\u1263\u122D \u134B\u12ED\u120E\u127D (%(numberFiles)s)',
    'Existing Source': '\u1290\u1263\u122D \u121D\u1295\u132D',
    'File name': '\u12E8\u1218\u12DD\u1308\u1265 \u1235\u121D',
    'Location Folder': '\u12E8\u12A0\u12AB\u1263\u1262 \u12A0\u1243\u134A',
    'Location folder does not exist in the cloud_':
      '\u12E8\u12A0\u12AB\u1263\u1262 \u12A0\u1243\u134A \u1260\u12F0\u1218\u1293 \u12CD\u1235\u1325 \u12E8\u1208\u121D\u1362',
    'Location folder must contain a single `self_serve_input` file_':
      '\u12E8\u12A0\u12AB\u1263\u1262 \u12A0\u1243\u134A \u12A0\u1295\u12F5 \u1290\u1320\u120B `\u1260\u122B\u1235_\u121B\u1308\u120D\u1308\u120D_\u130D\u1264\u1275` \u134B\u12ED\u120D \u1218\u12EB\u12DD \u12A0\u1208\u1260\u1275\u1362',
    'Location folder must contain files with the same extension_':
      '\u12E8\u12A0\u12AB\u1263\u1262 \u12A0\u1243\u134A \u1270\u1218\u1233\u1233\u12ED \u1245\u1325\u12EB \u12EB\u120B\u1278\u12CD \u134B\u12ED\u120E\u127D\u1295 \u1218\u12EB\u12DD \u12A0\u1208\u1260\u1275\u1362',
    'Looks like the Upload failed':
      '\u1218\u132B\u1295 \u12EB\u120D\u1270\u1233\u12AB \u12ED\u1218\u1235\u120B\u120D',
    'No headers to validate':
      '\u12E8\u121A\u1228\u130B\u1308\u1321 \u1204\u12F0\u122D \u12E8\u1209\u121D',
    'No valid input files found in location folder_':
      '\u1260\u1218\u1308\u129B \u12A0\u1243\u134A \u12CD\u1235\u1325 \u121D\u1295\u121D \u12E8\u121A\u1230\u1229 \u12E8\u130D\u1264\u1275 \u134B\u12ED\u120E\u127D \u12A0\u120D\u1270\u1308\u1299\u121D\u1362',
    'Parameterized Dataprep dataset does not have the expected path_':
      '\u12E8\u1270\u1218\u1323\u1320\u1290 \u12E8\u12F3\u1273 \u1355\u122A\u1355 \u12F3\u1273 \u1235\u1265\u1235\u1265 \u12E8\u121A\u1320\u1260\u1240\u12CD \u1218\u1295\u1308\u12F5 \u12E8\u1208\u12CD\u121D\u1362',
    'Recipe ID':
      '\u12E8\u121D\u130D\u1265 \u12A0\u1230\u122B\u122D \u1218\u1273\u12C8\u1242\u12EB',
    'Replace entire dataset':
      '\u1219\u1209\u12CD\u1295 \u12E8\u12F3\u1273 \u1235\u1265\u1235\u1265 \u12ED\u1270\u12A9',
    'See full list of column names':
      '\u12E8\u12A0\u121D\u12F5 \u1235\u121E\u127D\u1295 \u1219\u1209 \u12DD\u122D\u12DD\u122D \u12ED\u1218\u120D\u12A8\u1271',
    'Select a source': '\u121D\u1295\u132D \u12ED\u121D\u1228\u1321',
    'The files that appear below are the current Dataprep inputs_ When the Dataprep job is run, these files are merged and processed through the Dataprep recipe_':
      '\u12A8\u1273\u127D \u12E8\u121A\u1273\u12E9\u1275 \u134B\u12ED\u120E\u127D \u12E8\u12A0\u1201\u1291 \u12E8Dataprep \u130D\u1265\u12D3\u1276\u127D \u1293\u1278\u12CD\u1362 \u12E8Dataprep \u1235\u122B\u12CD \u1232\u1230\u122B \u12A5\u1290\u12DA\u1205 \u134B\u12ED\u120E\u127D \u12ED\u12CB\u1203\u12F3\u1209 \u12A5\u1293 \u1260Dataprep \u12E8\u121D\u130D\u1265 \u12A0\u1230\u122B\u122D \u1260\u12A9\u120D \u12ED\u12A8\u1293\u12C8\u1293\u1209\u1362',
    'There are no uploaded input files_':
      '\u121D\u1295\u121D \u12E8\u1270\u132B\u1291 \u12E8\u130D\u1264\u1275 \u134B\u12ED\u120E\u127D \u12E8\u1209\u121D\u1362',
    'Try again': '\u12A5\u1295\u12F0\u1308\u1293 \u12ED\u121E\u12AD\u1229',
    'Update Type': '\u12E8\u12DD\u121B\u1294 \u12A0\u12ED\u1290\u1275',
    'Update Type is fetched from Dataprep based on Recipe ID':
      '\u12E8\u12DD\u121B\u1294 \u12A0\u12ED\u1290\u1275 \u1260\u12A0\u12D8\u1308\u1303\u1300\u1275 \u1218\u1273\u12C8\u1242\u12EB \u120B\u12ED \u1270\u1218\u1235\u122D\u1276 \u12A8 Dataprep \u12E8\u1270\u1308\u1298 \u1290\u12CD\u1362',
    'Upload columns are out of order_ Expected order:':
      '\u1230\u1240\u120B \u12A0\u121D\u12F6\u127D \u12A8\u1275\u12D5\u12DB\u12DD \u12CD\u132A \u1293\u1278\u12CD\u1362 \u12E8\u121A\u1320\u1260\u1240\u12CD \u1275\u12A5\u12DB\u12DD\u1361-',
    'Upload contains these additional columns:':
      '\u1230\u1240\u120B\u12CD \u12A5\u1290\u12DA\u1205\u1295 \u1270\u1328\u121B\u122A \u12A0\u121D\u12F6\u127D \u12ED\u12DF\u120D\u1361-',
    'Upload is missing these required columns:':
      '\u1230\u1240\u120B\u12CD \u12A5\u1290\u12DA\u1205 \u12A0\u1235\u1348\u120B\u130A \u12A0\u121D\u12F6\u127D \u12ED\u130E\u12F5\u120B\u1209\u1361',
    'You can download the existing input files below to see what format new files must adhere to_ You may also remove files, which will have the effect of removing files from cloud storage_':
      '\u12A0\u12F2\u1235 \u134B\u12ED\u120E\u127D \u1260\u121D\u1295 \u12A0\u12ED\u1290\u1275 \u1245\u122D\u1340\u1275 \u1218\u12A8\u1270\u120D \u12A5\u1295\u12F3\u1208\u1263\u1278\u12CD \u1208\u121B\u12E8\u1275 \u12A8\u12DA\u1205 \u1260\u1273\u127D \u12EB\u1209\u1275\u1295 \u12E8\u130D\u1264\u1275 \u134B\u12ED\u120E\u127D \u121B\u12CD\u1228\u12F5 \u12ED\u127D\u120B\u1209\u1362 \u12A5\u1295\u12F2\u1201\u121D \u134B\u12ED\u120E\u127D\u1295 \u121B\u1235\u12C8\u1308\u12F5 \u12ED\u127D\u120B\u1209, \u12ED\u1205\u121D \u134B\u12ED\u120E\u127D\u1295 \u12A8\u12F0\u1218\u1293 \u121B\u12A8\u121B\u127B \u12E8\u121B\u1235\u12C8\u1308\u12F5 \u12CD\u1324\u1275 \u12ED\u1296\u1228\u12CB\u120D.',
    'dataprep-disabled-source-name':
      '\u12E8\u12F3\u1273 \u1355\u122A\u1355 \u121D\u1295\u132D \u1235\u121E\u127D\u1295 \u121B\u1235\u1270\u12AB\u12A8\u120D \u12A0\u12ED\u127B\u120D\u121D\u1362',
    'delete file': '\u134B\u12ED\u120D \u1230\u122D\u12DD',
    'download file': '\u1230\u1290\u12F5 \u12A0\u12CD\u122D\u12F5',
  },
  fr: {
    dataprepDescription:
      "Afin de r\xE9ussir l'int\xE9gration de vos donn\xE9es dans notre base de donn\xE9es, les noms des colonnes de donn\xE9es doivent correspondre \xE0 votre recette de donn\xE9es d'origine\xA0:",
    fileNotMatched:
      'Le fichier charg\xE9 (uploaded) ne correspond pas au format requis.',
    locationInfo:
      "Le dossier d'emplacement du jeu de donn\xE9es attendu se trouve ci-dessous.",
    noHeadersDetected:
      "Aucun en-t\xEAte n'a \xE9t\xE9 d\xE9tect\xE9 dans le fichier source d'origine.",
    recipeInfo:
      "L'ID de la recette est un nombre qui peut \xEAtre trouv\xE9 dans l'URL de dataprep. Cliquez sur la derni\xE8re \xE9tape de la recette avant la sortie et utilisez cet identifiant (ID).",
    sourceDropdownInfo:
      'Les sources libre-service Dataprep n\xE9cessitent une \xE9tape de pipeline existante. S\xE9lectionnez-en un dans la liste ci-dessous\xA0; les \xE9l\xE9ments sont r\xE9pertori\xE9s en tant que "Name (ID source)".',
    updateTypeInfo:
      "Le type de mise \xE0 jour est d\xE9fini dans Dataprep. Les flux avec des ensembles de donn\xE9es d'entr\xE9e param\xE9tr\xE9s sont du type Ajouter de nouveaux fichiers\", tandis que les flux avec un seul fichier d'entr\xE9e sont du type \"Remplacer l'ensemble de l'ensemble de donn\xE9es\".\nCette option ne peut pas \xEAtre activ\xE9e ici et doit \xEAtre effectu\xE9e dans Dataprep.",
    '%(columnsCount)s column(s)': '%(columnsCount)s colonne(s)',
    '<source ID>': '<identifiant de la source>',
    'Append new files': 'Ajouter de nouveaux fichiers',
    'Dataprep Flow must have one input dataset in expected folder_': '',
    'Dataprep recipe ID does not exist_': '',
    'Dataprep recipe ID is not the last recipe ID in Flow_': '',
    'Date uploaded': 'Date de t\xE9l\xE9chargement',
    'Error downloading file': 'Erreur de t\xE9l\xE9chargement du fichier',
    'Existing Files (%(numberFiles)s)':
      'Fichiers existants (%(nombreFichiers)s)',
    'Existing Source': 'Source existante',
    'File name': 'Nom du fichier',
    'Location Folder': 'Emplacement Dossier',
    'Location folder does not exist in the cloud_': '',
    'Location folder must contain a single `self_serve_input` file_': '',
    'Location folder must contain files with the same extension_': '',
    'Looks like the Upload failed':
      'Il semble que le chargement ait \xE9chou\xE9',
    'No headers to validate': 'Aucun en-t\xEAte \xE0 valider',
    'No valid input files found in location folder_': '',
    'Parameterized Dataprep dataset does not have the expected path_': '',
    'Recipe ID': 'Identifiant de la recette',
    'Replace entire dataset': "Remplacer l'ensemble des donn\xE9es",
    'See full list of column names':
      'Voir la liste compl\xE8te des noms de colonnes',
    'Select a source': 'S\xE9lectionnez une source',
    'The files that appear below are the current Dataprep inputs_ When the Dataprep job is run, these files are merged and processed through the Dataprep recipe_':
      'Les fichiers qui apparaissent ci-dessous sont les entr\xE9es actuelles de Dataprep. Lorsque la t\xE2che Dataprep est ex\xE9cut\xE9e, ces fichiers sont fusionn\xE9s et trait\xE9s par la recette Dataprep.',
    'There are no uploaded input files_':
      "Il n'y a pas de fichiers d'entr\xE9e t\xE9l\xE9charg\xE9s.",
    'Try again': 'R\xE9essayer',
    'Update Type': 'Type de mise \xE0 jour',
    'Update Type is fetched from Dataprep based on Recipe ID':
      "Le type de mise \xE0 jour est extrait de Dataprep en fonction de l'ID de la recette.",
    'Upload columns are out of order_ Expected order:': '',
    'Upload contains these additional columns:': '',
    'Upload is missing these required columns:': '',
    'You can download the existing input files below to see what format new files must adhere to_ You may also remove files, which will have the effect of removing files from cloud storage_':
      "Vous pouvez t\xE9l\xE9charger les fichiers d'entr\xE9e existants ci-dessous pour voir quel format les nouveaux fichiers doivent respecter. Vous pouvez \xE9galement supprimer des fichiers, ce qui aura pour effet de supprimer les fichiers du stockage en nuage.",
    'dataprep-disabled-source-name': '',
    'delete file': 'supprimer le fichier',
    'download file': 't\xE9l\xE9charger le fichier',
  },
  br: {
    dataprepDescription:
      'A fim de ingerir com sucesso seus dados em nosso banco de dados, os nomes das colunas de dados devem corresponder \xE0 sua receita de dados original:',
    fileNotMatched:
      'O arquivo carregado n\xE3o correspondeu ao formato exigido.',
    locationInfo:
      'A pasta de localiza\xE7\xE3o esperada do conjunto de dados est\xE1 abaixo.',
    noHeadersDetected:
      'N\xE3o foram detectados cabe\xE7alhos no arquivo de origem original.',
    recipeInfo:
      'A identifica\xE7\xE3o da receita \xE9 um n\xFAmero que pode ser encontrado na URL do dataprep. Clique na \xFAltima etapa da receita antes da sa\xEDda e use essa identifica\xE7\xE3o.',
    sourceDropdownInfo:
      'As fontes de autoatendimento dataprep requerem uma etapa de pipeline existente. Selecione uma da lista abaixo; os itens s\xE3o listados como "Nome (Identifica\xE7\xE3o da Fonte)".',
    updateTypeInfo:
      'Update Type est\xE1 definido em Dataprep. Os fluxos com conjuntos de dados de entrada parametrizados s\xE3o do tipo ""Acrescentar novos arquivos"", enquanto os fluxos com um \xFAnico arquivo de entrada s\xE3o do tipo ""Substituir todo o conjunto de dados"". Esta op\xE7\xE3o n\xE3o pode ser alternada aqui e deve ser feita em "Dataprep".',
    '%(columnsCount)s column(s)': '%(columnsCount)s coluna(s)',
    '<source ID>': '<identifica\xE7\xE3o da fonte>',
    'Append new files': 'Anexar novos arquivos',
    'Dataprep Flow must have one input dataset in expected folder_':
      'O Fluxo do Dataprep deve ter um conjunto de dados de entrada na pasta esperada.',
    'Dataprep recipe ID does not exist_':
      'O ID da receita do Dataprep n\xE3o existe.',
    'Dataprep recipe ID is not the last recipe ID in Flow_':
      'O ID da receita do Dataprep n\xE3o \xE9 o \xFAltimo ID da receita no fluxo.',
    'Date uploaded': 'Data do upload',
    'Error downloading file': 'Erro no download do arquivo',
    'Existing Files (%(numberFiles)s)': 'Arquivos Existentes (%(numberFiles)s)',
    'Existing Source': 'Fonte Existente',
    'File name': 'Nome do arquivo',
    'Location Folder': 'Pasta de localiza\xE7\xE3o',
    'Location folder does not exist in the cloud_':
      'A pasta de localiza\xE7\xE3o n\xE3o existe na nuvem.',
    'Location folder must contain a single `self_serve_input` file_':
      'A pasta de localiza\xE7\xE3o deve conter um \xFAnico arquivo `self_serve_input`.',
    'Location folder must contain files with the same extension_':
      'A pasta de localiza\xE7\xE3o deve conter arquivos com a mesma extens\xE3o.',
    'Looks like the Upload failed': 'Parece que o Upload falhou',
    'No headers to validate': 'Sem cabe\xE7alhos para validar',
    'No valid input files found in location folder_':
      'Nenhum arquivo de entrada v\xE1lido foi encontrado na pasta de localiza\xE7\xE3o.',
    'Parameterized Dataprep dataset does not have the expected path_':
      'O conjunto de dados parametrizados do Dataprep n\xE3o tem o caminho esperado.',
    'Recipe ID': 'Id da receita',
    'Replace entire dataset': 'Substituir todo o conjunto de dados',
    'See full list of column names':
      'Veja a lista completa dos nomes das colunas',
    'Select a source': 'Selecione uma fonte',
    'The files that appear below are the current Dataprep inputs_ When the Dataprep job is run, these files are merged and processed through the Dataprep recipe_':
      'Os arquivos que aparecem abaixo s\xE3o as entradas atuais da Dataprep. Quando o trabalho Dataprep \xE9 executado, estes arquivos s\xE3o fundidos e processados atrav\xE9s da receita Dataprep.',
    'There are no uploaded input files_':
      'N\xE3o h\xE1 arquivos de entrada carregados.',
    'Try again': 'Tente novamente',
    'Update Type': 'Tipo de atualiza\xE7\xE3o',
    'Update Type is fetched from Dataprep based on Recipe ID':
      'O tipo de atualiza\xE7\xE3o \xE9 obtido do Dataprep baseado no ID da receita',
    'Upload columns are out of order_ Expected order:':
      'As colunas de upload est\xE3o fora de ordem. Ordem esperada:',
    'Upload contains these additional columns:':
      'O upload cont\xE9m estas colunas adicionais:',
    'Upload is missing these required columns:':
      'O upload est\xE1 faltando estas colunas obrigat\xF3rias:',
    'You can download the existing input files below to see what format new files must adhere to_ You may also remove files, which will have the effect of removing files from cloud storage_':
      'Voc\xEA pode baixar os arquivos de entrada existentes abaixo para ver qual o formato os novos arquivos devem aderir. Voc\xEA tamb\xE9m pode remover arquivos, o que ter\xE1 o efeito de remover arquivos do armazenamento em nuvem.',
    'dataprep-disabled-source-name':
      'Os nomes de origem do Dataprep n\xE3o podem ser editados.',
    'delete file': 'excluir arquivo',
    'download file': 'arquivo para download',
  },
};
export default translations;
