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
    attachmentsText: 'Attachments will include all data visible to you.',
    confirmText: 'Please confirm you would like to proceed.',
    externalRecipientText:
      'You are sending this analysis to a recipient who is not registered on the platform. External recipients are:',
    noDashboardAccess:
      'They will not be able to access the dashboard or see data on attachments (unless it is a shared thread or you changed attachment settings for this email). Consider inviting them to the dashboard before sending this email.',
    '"%(value)s" is not a valid email address or user group name':
      '"%(value)s" is not a valid email address or user group name',
    'Confirm Sharing': 'Confirm Sharing',
    "Enter a user group name or recipient's email address":
      "Enter a user group name or recipient's email address",
    'Selected group "%(name)s" has no members':
      'Selected group "%(name)s" has no members',
    'The following recipients do not have access to this dashboard:':
      'The following recipients do not have access to this dashboard:',
  },
  am: {},
  fr: {},
  pt: {
    attachmentsText: 'Anexos incluirão todos os dados visíveis.',
    confirmText: 'Confirme se gostaria de continuar.',
    'Confirm Sharing': 'Confirmar compartilhamento',
    "Enter a user group name or recipient's email address":
      'Insira nome do grupo de usuários ou enderço de email',
  },
};
export default translations;
