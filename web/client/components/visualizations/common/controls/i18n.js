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
    Ascending: 'Ascending',
    Descending: 'Descending',
    Indicators: 'Indicators',
    No: 'No',
    Yes: 'Yes',
    dimensionBreakdown: 'Grouping',
    field: 'Indicator',
    fieldBreakdown: 'Field',
    'Breakdown results by': 'Breakdown results by',
    'Color palette': 'Color palette',
    'Limit results': 'Limit results',
    'Selected field': 'Selected field',
    'Sort order': 'Sort order',
    'pivot-warning-body':
      'Custom themes are not supported for pivoted tables. Press continue to pivot, and reset the table theme to the default theme.',
    'pivot-warning-header': 'Custom themes not supported for pivot table',
  },
  pt: {
    Ascending: 'Crescente',
    Descending: 'Decrescente',
    Indicators: 'Indicadores',
    No: 'N\xE3o',
    Yes: 'Sim',
    dimensionBreakdown: 'Agrupamento',
    field: 'Indicador',
    fieldBreakdown: 'Campo',
    'Breakdown results by': 'Resultados da decomposi\xE7\xE3o por',
    'Color palette': 'Paleta de cores',
    'Limit results': 'Limitar resultados',
    'Selected field': 'Selecionar campo',
    'Sort order': 'Sortir Ordem',
    'pivot-warning-body':
      'Os temas personalizados n\xE3o s\xE3o suportados para tabelas din\xE2micas (pivot). Pressione continuar para redefinir o tema da tabela para o tema padr\xE3o.',
    'pivot-warning-header':
      'Temas personalizados n\xE3o suportados para tabela din\xE2micas (pivot)',
  },
  vn: {
    Ascending: 'T\u0103ng d\u1EA7n',
    Descending: 'Gi\u1EA3m d\u1EA7n',
    Indicators: 'C\xE1c ch\u1EC9 s\u1ED1',
    No: 'Kh\xF4ng',
    Yes: '\u0110\xFAng',
    dimensionBreakdown: 'Ph\xE2n nh\xF3m',
    field: 'Ch\u1EC9 s\u1ED1',
    fieldBreakdown: 'tr\u01B0\u1EDDng',
    'Breakdown results by': 'Ph\xE2n nh\u1ECF k\u1EBFt qu\u1EA3 theo',
    'Color palette': 'B\u1EA3ng m\xE0u',
    'Limit results': 'Gi\u1EDBi h\u1EA1n k\u1EBFt qu\u1EA3',
    'Selected field': 'Tr\u01B0\u1EDDng \u0111\xE3 ch\u1ECDn',
    'Sort order': 'Th\u1EE9 t\u1EF1 s\u1EAFp x\u1EBFp',
    'pivot-warning-body':
      'C\xE1c ch\u1EE7 \u0111\u1EC1 tu\u1EF3 ch\u1EC9nh kh\xF4ng \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3 cho c\xE1c b\u1EA3ng t\u1ED5ng h\u1EE3p (pivoted table). Nh\u1EA5n ti\u1EBFp t\u1EE5c \u0111\u1EC3 t\u1ED5ng h\u1EE3p th\xF4ng tin, v\xE0 c\xE0i \u0111\u1EB7t l\u1EA1i ch\u1EE7 \u0111\u1EC1 b\u1EA3ng v\u1EC1 ch\u1EE7 \u0111\u1EC1 m\u1EB7c \u0111\u1ECBnh',
    'pivot-warning-header':
      'Ch\u1EE7 \u0111\u1EC1 tu\u1EF3 ch\u1EC9nh kh\xF4ng \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3 cho b\u1EA3ng t\u1ED5ng h\u1EE3p',
  },
  am: {
    Ascending: 'ከትንሽ ወደ ትልቅ',
    Descending: 'ከትልቅ ወደ ትንሽ',
    Indicators: '\u1320\u124B\u121A\u12CE\u127D',
    No: '\u12A0\u12ED\u12F0\u1208\u121D',
    Yes: '\u12A0\u12CE',
    dimensionBreakdown: '\u1218\u1267\u12F0\u1295',
    field: '\u12A0\u1218\u120D\u12AB\u127D',
    fieldBreakdown: '\u1218\u1235\u12AD',
    'Breakdown results by':
      '\u12E8\u1218\u12A8\u134B\u1348\u120D \u12CD\u1324\u1276\u127D \u1260',
    'Color palette':
      '\u12E8\u1240\u1208\u121D \u1264\u1270 -\u1235\u12D5\u120D',
    'Limit results': 'ውጤቶችን ገድብ',
    'Selected field': 'የተመረጠው መስክ',
    'Sort order': 'ቅደም ተከተል ደርድር',
    'pivot-warning-body':
      '\u1265\u1301 \u1308\u133D\u1273\u12CE\u127D \u1208\u1270\u1230\u12E8\u1219 \u1320\u1228\u1334\u12DB\u12CE\u127D \u12A0\u12ED\u12F0\u1308\u1349\u121D\u1362 \u1208\u1352\u126E\u1275 \u1240\u1325\u120D\u1295 \u12ED\u132B\u1291 \u12A5\u1293 \u12E8\u1230\u1295\u1320\u1228\u12E1\u1295 \u1308\u133D\u1273 \u12C8\u12F0 \u1290\u1263\u122A \u1308\u133D\u1273 \u12EB\u1235\u1300\u121D\u1229\u1275\u1362',
    'pivot-warning-header':
      '\u1265\u1301 \u1308\u133D\u1273\u12CE\u127D \u1208\u1352\u126E\u1275 \u1220\u1295\u1320\u1228\u12E5 \u12A0\u12ED\u12F0\u1308\u134D\u121D\u1362',
  },
  fr: {
    Ascending: 'Ascendant',
    Descending: 'Descendant',
    Indicators: 'Indicateurs',
    No: 'Non',
    Yes: 'Oui',
    dimensionBreakdown: 'Regroupement',
    field: 'Indicateur',
    fieldBreakdown: 'Champ',
    'Breakdown results by': 'R\xE9partition des r\xE9sultats par',
    'Color palette': 'Palette de couleurs',
    'Limit results': 'Limiter les Résultats',
    'Selected field': 'Champ Sélectionné',
    'Sort order': 'Ordre de tri',
    'pivot-warning-body':
      'Les th\xE8mes personnalis\xE9s ne sont pas pris en charge pour les tableaux crois\xE9s dynamiques. Appuyez sur continuer pour pivoter et r\xE9initialiser le th\xE8me du tableau au th\xE8me par d\xE9faut.',
    'pivot-warning-header':
      'Les th\xE8mes personnalis\xE9s ne sont pas pris en charge pour les tableaux crois\xE9s dynamiques',
  },
  br: {
    Ascending: 'Crescente',
    Descending: 'Decrescente',
    Indicators: 'Indicadores',
    No: 'Não',
    Yes: 'Sim',
    dimensionBreakdown: 'Agrupamento',
    field: 'Indicador',
    fieldBreakdown: 'Campo',
    'Breakdown results by': 'Resultados da decomposi\xE7\xE3o por',
    'Color palette': 'Paleta de cores',
    'Limit results': 'Limitar resultados',
    'Selected field': 'Selecionar campo',
    'Sort order': 'Sortir Ordem',
    'pivot-warning-body':
      'N\xE3o h\xE1 suporte para temas personalizados em tabelas din\xE2micas. Pressione Continuar para dinamizar e redefinir o tema da tabela para o tema padr\xE3o.',
    'pivot-warning-header':
      'Temas personalizados sem suporte para tabela din\xE2mica',
  },
};
export default translations;
