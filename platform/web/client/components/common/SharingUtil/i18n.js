// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_common_SharingUtil_ShareByEmailUtil from 'components/common/SharingUtil/ShareByEmailUtil/i18n';
import i18n_components_common_SharingUtil_ShareQueryModal from 'components/common/SharingUtil/ShareQueryModal/i18n';
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
    copyToClipboardSuccess:
      'Shareable link was successfully copied to clipboard',
    '"%(value)s" is not a valid email address or group name':
      '"%(value)s" is not a valid email address or group name',
    'Please enter a correct recipient email':
      'Please enter a correct recipient email',
    'Please enter a message': 'Please enter a message',
    'Please enter a subject': 'Please enter a subject',
  },
  pt: {
    copyToClipboardSuccess:
      'O link para partilh\xE1 foi copiado para seu clipboard com sucesso',
    '"%(value)s" is not a valid email address or group name':
      '%(value)s n\xE3o \xE9 um endere\xE7o de e-mail v\xE1lido ou nome de grupo',
    'Please enter a correct recipient email':
      'Por favor, indique um email destinat\xE1rio correto',
    'Please enter a message': 'Por favor, digite uma mensagem',
    'Please enter a subject': 'Por favor insira um assunto',
  },
  vn: {
    copyToClipboardSuccess:
      'Li\xEAn k\u1EBFt c\xF3 th\u1EC3 chia s\u1EBB \u0111\xE3 \u0111\u01B0\u1EE3c sao ch\xE9p th\xE0nh c\xF4ng v\xE0o khay nh\u1EDB t\u1EA1m',
    '"%(value)s" is not a valid email address or group name':
      '"%(value)s" kh\xF4ng ph\u1EA3i l\xE0 \u0111\u1ECBa ch\u1EC9 email ho\u1EB7c t\xEAn nh\xF3m h\u1EE3p l\u1EC7',
    'Please enter a correct recipient email':
      'Vui l\xF2ng nh\u1EADp \u0111\xFAng email ng\u01B0\u1EDDi nh\u1EADn',
    'Please enter a message': 'Vui l\xF2ng nh\u1EADp m\u1ED9t tin nh\u1EAFn',
    'Please enter a subject': 'l\xE0m \u01A1n nh\u1EADp ch\u1EE7 \u0111\u1EC1',
  },
  am: {
    copyToClipboardSuccess: 'ሊጋራ የሚችል አገናኝ በተሳካ ሁኔታ ወደ ቅንጥብ ሰሌዳ ተቀድቷል።',
    '"%(value)s" is not a valid email address or group name':
      '%(value)s \u1275\u12AD\u12AD\u1208\u129B \u12E8\u12A2\u121C\u12ED\u120D \u12A0\u12F5\u122B\u123B \u12C8\u12ED\u121D \u12E8\u1261\u12F5\u1295 \u1235\u121D \u12A0\u12ED\u12F0\u1208\u121D',
    'Please enter a correct recipient email': 'እባክዎ ትክክለኛ የተቀባይ ኢሜይል ያስገቡ',
    'Please enter a message': 'እባክህ መልእክት አስገባ',
    'Please enter a subject': 'እባክዎን ርዕሰ ጉዳይ ያስገቡ',
  },
  fr: {
    copyToClipboardSuccess:
      'Le lien partageable a été copié avec succès dans le presse-papiers',
    '"%(value)s" is not a valid email address or group name':
      "%(value)s n'est pas une adresse e-mail ou un nom de groupe valide",
    'Please enter a correct recipient email':
      'Veuillez saisir un email de destinataire correct',
    'Please enter a message': 'Veuillez saisir un message',
    'Please enter a subject': 'Veuillez entrer un sujet',
  },
  br: {
    copyToClipboardSuccess:
      'O link para partilhá foi copiado para seu clipboard com sucesso',
    '"%(value)s" is not a valid email address or group name':
      '%(value)s n\xE3o \xE9 um endere\xE7o de e-mail v\xE1lido ou nome de grupo',
    'Please enter a correct recipient email':
      'Por favor, indique um email destinatário correto',
    'Please enter a message': 'Por favor, digite uma mensagem',
    'Please enter a subject': 'Por favor insira um assunto',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_common_SharingUtil_ShareByEmailUtil,
  i18n_components_common_SharingUtil_ShareQueryModal,
]);
export default translations;
