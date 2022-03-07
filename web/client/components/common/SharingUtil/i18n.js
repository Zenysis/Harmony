// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_common_SharingUtil_ShareByEmailUtil_ShareEmailFormControls from 'components/common/SharingUtil/ShareByEmailUtil/ShareEmailFormControls/i18n';
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
    '"%(value)s" is not a valid email address or group name':
      '"%(value)s" is not a valid email address or group name',
  },
  am: {},
  fr: {},
  pt: {},
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_common_SharingUtil_ShareByEmailUtil_ShareEmailFormControls,
  i18n_components_common_SharingUtil_ShareQueryModal,
]);
export default translations;
