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
    dimensionAllTooltip:
      'When possible, include all %(dimension)s values in the result even if they have no data. Warning: This option can cause your query to be much slower.',
    dimensionTotalTooltip:
      'This option adds a total row across all values for this group by. If more than one group by is selected, the total row will be added for each section within the parent group.',
    forceAllValuesToBeIncluded: 'Force all values to be included (slow)',
    includeNull: 'Include empty values',
    includeTotal: 'Include total values',
    'Label:': 'Label:',
  },
  pt: {
    dimensionAllTooltip:
      'Quando poss\xEDvel, incluir todos os valores %(dimension)s no resultado, mesmo que n\xE3o tenham dados. Advert\xEAncia: Esta op\xE7\xE3o pode fazer com que sua consulta seja muito mais lenta.',
    dimensionTotalTooltip:
      'This option adds a total row across all values for this group by. If more than one group by is selected, the total row will be added for each section within the parent group.',
    forceAllValuesToBeIncluded:
      'For\xE7ar todos os valores a serem inclu\xEDdos (slow)',
    includeNull: 'Incluir dados em branco',
    includeTotal: 'incluir dados totais',
    'Label:': 'Legenda:',
  },
  vn: {
    dimensionAllTooltip:
      'Khi c\xF3 th\u1EC3, h\xE3y bao g\u1ED3m t\u1EA5t c\u1EA3 %(dimension)s c\xE1c gi\xE1 tr\u1ECB trong k\u1EBFt qu\u1EA3 ngay c\u1EA3 khi ch\xFAng kh\xF4ng c\xF3 d\u1EEF li\u1EC7u. C\u1EA3nh b\xE1o: T\xF9y ch\u1ECDn n\xE0y c\xF3 th\u1EC3 khi\u1EBFn truy v\u1EA5n c\u1EE7a b\u1EA1n ch\u1EADm h\u01A1n nhi\u1EC1u.',
    dimensionTotalTooltip:
      'T\xF9y ch\u1ECDn n\xE0y th\xEAm t\u1ED5ng s\u1ED1 h\xE0ng tr\xEAn t\u1EA5t c\u1EA3 c\xE1c gi\xE1 tr\u1ECB cho nh\xF3m n\xE0y b\u1EB1ng. N\u1EBFu nhi\u1EC1u nh\xF3m theo \u0111\u01B0\u1EE3c ch\u1ECDn, t\u1ED5ng h\xE0ng s\u1EBD \u0111\u01B0\u1EE3c th\xEAm v\xE0o cho m\u1ED7i ph\u1EA7n trong nh\xF3m ch\xEDnh.',
    forceAllValuesToBeIncluded:
      'B\u1EAFt bu\u1ED9c bao g\u1ED3m t\u1EA5t c\u1EA3 c\xE1c gi\xE1 tr\u1ECB (ch\u1EADm)',
    includeNull: 'Bao g\u1ED3m c\xE1c gi\xE1 tr\u1ECB tr\u1ED1ng',
    includeTotal: 'Bao g\u1ED3m t\u1ED5ng gi\xE1 tr\u1ECB',
    'Label:': 'Nh\xE3n m\xE1c:',
  },
  am: {
    dimensionAllTooltip:
      '\u12A8\u1270\u127B\u1208 \u121D\u1295\u121D  \u1263\u12ED\u1296\u122B\u1278\u12CD\u121D \u1201\u1209\u1295\u121D \u12E8%(dimension)s \u12CD\u1324\u1276\u127D \u1260\u12CD\u1324\u1271 \u12CD\u1235\u1325 \u12EB\u12AB\u1275\u1271\u1362 \u121B\u1235\u1320\u1295\u1240\u1242\u12EB\u1361 \u12ED\u1205 \u12A0\u121B\u122B\u132D \u1325\u12EB\u1244\u12CE\u1295 \u1260\u1323\u121D \u1240\u122D\u134B\u134B \u12A5\u1295\u12F2\u1206\u1295 \u120A\u12EB\u12F0\u122D\u130D \u12ED\u127D\u120B\u120D',
    dimensionTotalTooltip:
      'ይህ አማራጭ ለዚህ ቡድን በሁሉም ውጤቶች ላይ ጠቅላላ ረድፍ ያክላል በ. ከአንድ በላይ ቡድን ከተመረጠ፣ አጠቃላይ ረድፉ በወላጅ ቡድን ውስጥ ላለው እያንዳንዱ ክፍል ይታከላል።',
    forceAllValuesToBeIncluded:
      '\u1201\u1209\u121D \u12CD\u1324\u1276\u127D \u12A5\u1295\u12F2\u12AB\u1270\u1271 \u12A0\u1235\u1308\u12F5\u12F5 (\u1240\u122D\u134B\u134B)',
    includeNull: 'ባዶ ውጤቶችን ያካትቱ',
    includeTotal: 'አጠቃላይ ውጤቶችን ያካትቱ',
    'Label:': 'መለያ',
  },
  fr: {
    dimensionAllTooltip:
      'Lorsque cela est possible, incluez toutes les valeurs %(dimension)s dans le r\xE9sultat, m\xEAme si elles ne contiennent aucune donn\xE9e. Avertissement\xA0: Cette option peut ralentir consid\xE9rablement votre requ\xEAte.',
    dimensionTotalTooltip:
      'This option adds a total row across all values for this group by. If more than one group by is selected, the total row will be added for each section within the parent group.',
    forceAllValuesToBeIncluded:
      'Forcer toutes les valeurs \xE0 \xEAtre incluses (lent)',
    includeNull: 'Inclure les valeurs vides',
    includeTotal: 'Inclure les valeurs totales',
    'Label:': 'À propos',
  },
  br: {
    dimensionAllTooltip:
      'Quando poss\xEDvel, incluir todos os valores %(dimension)s no resultado, mesmo que n\xE3o tenham dados. Advert\xEAncia: Esta op\xE7\xE3o pode fazer com que sua consulta seja muito mais lenta.',
    dimensionTotalTooltip:
      'Essa op\xE7\xE3o adiciona uma linha total de todos os valores para esse grupo por. Se mais de um grupo por for selecionado, a linha total ser\xE1 adicionada para cada se\xE7\xE3o dentro do grupo pai.',
    forceAllValuesToBeIncluded:
      'For\xE7ar todos os valores a serem inclu\xEDdos (slow)',
    includeNull: 'Incluir dados em branco',
    includeTotal: 'incluir dados totais',
    'Label:': 'Legenda:',
  },
};
export default translations;
