// @flow

/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_Authentication_ForgotPassword from 'components/Authentication/ForgotPassword/i18n';
import i18n_components_Authentication_Login from 'components/Authentication/Login/i18n';
import i18n_components_Authentication_Register from 'components/Authentication/Register/i18n';
import i18n_components_Authentication_ResetPassword from 'components/Authentication/ResetPassword/i18n';
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
    expired_token: 'Expired token.',
    invalid_invitation_link: 'Invalid invitation link.',
    invalid_login_credentials: 'Incorrect username and/or password.',
    invalid_reset_link: 'Invalid password reset link.',
    no_invitation_link: 'Registration is invite only.',
    non_existent_user: 'This user account does not exist',
    password_reset_email_failed: 'Failed to send password reset email.',
    password_reset_email_sent:
      'If there is an account associated with the provided email address, the password reset link has been shared with it.',
    password_reset_success: 'Password reset successfully.',
    'Something went wrong': 'Something went wrong',
  },
  pt: {
    expired_token: 'Expirou',
    invalid_invitation_link: 'Link convite invalido',
    invalid_login_credentials:
      'nome de usu\xE1rio ou/e palavra passe incorreto',
    invalid_reset_link: 'Link para redefini\xE7\xE3o de palavra passe invalido',
    no_invitation_link: 'Registro apenas por convite',
    password_reset_email_failed:
      'Falha no envio do email de redefini\xE7\xE3o de palavra passe',
    password_reset_email_sent:
      'Se houver uma conta associada ao email providenciado, o link para redefini\xE7\xE3o de palavra passe foi partilhada',
    password_reset_success: 'Redefini\xE7\xE3o de palavra passe com sucesso',
    'Something went wrong': 'Algo falhou',
  },
  vn: {
    expired_token: 'M\xE3 th\xF4ng b\xE1o (token) h\u1EBFt h\u1EA1n',
    invalid_invitation_link: 'Link l\u1EDDi m\u1EDDi kh\xF4ng h\u1EE3p l\u1EC7',
    invalid_login_credentials:
      'T\xEAn ng\u01B0\u1EDDi d\xF9ng v\xE0/ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng h\u1EE3p l\u1EC7',
    invalid_reset_link:
      'Link c\xE0i \u0111\u1EB7t l\u1EA1i m\u1EADt kh\u1EA9u kh\xF4ng h\u1EE3p l\u1EC7',
    no_invitation_link: 'Ch\u1EC9 \u0111\u0103ng k\xFD m\u1EDDi',
    password_reset_email_failed:
      'Kh\xF4ng th\u1EC3 g\u1EEDi email c\xE0i \u0111\u1EB7t l\u1EA1i m\u1EADt kh\u1EA9u',
    password_reset_email_sent:
      'N\u1EBFu c\xF3 m\u1ED9t t\xE0i kho\u1EA3n li\xEAn k\u1EBFt v\u1EDBi \u0111\u1ECBa ch\u1EC9 email \u0111\u01B0\u1EE3c cung c\u1EA5p, link \u0111\u1EB7t l\u1EA1i m\u1EADt kh\u1EA9u \u0111\xE3 \u0111\u01B0\u1EE3c chia s\u1EBB v\u1EDBi \u0111\u1ECBa ch\u1EC9 email \u0111\xF3.',
    password_reset_success:
      '\u0110\u1EB7t l\u1EA1i m\u1EADt kh\u1EA9u th\xE0nh c\xF4ng',
    'Something went wrong': 'C\xF3 g\xEC \u0111\xF3 kh\xF4ng \u0111\xFAng',
  },
  am: {
    expired_token:
      '\u130A\u12DC\u12CD \u12EB\u1208\u1348\u1260\u1275 \u121B\u1235\u1218\u1230\u12EB',
    invalid_invitation_link:
      '\u120D\u12AD \u12EB\u120D\u1206\u1290 \u12E8\u130D\u1265\u12E3 \u120A\u1295\u12AD\u1362',
    invalid_login_credentials:
      '\u12E8\u1270\u1233\u1233\u1270 \u12E8\u1270\u1320\u1243\u121A \u1235\u121D \u12A5\u1293/\u12C8\u12ED\u121D \u12E8\u12ED\u1208\u134D \u1243\u120D\u1362',
    invalid_reset_link:
      '\u12E8\u1270\u1233\u1233\u1270 \u12E8\u12ED\u1208\u134D \u1243\u120D \u12F3\u130D\u121D \u121B\u1235\u1300\u1218\u122A\u12EB \u120A\u1295\u12AD\u1362',
    no_invitation_link:
      '\u121D\u12DD\u1308\u1263 \u1260\u12A2\u1295\u126B\u12ED\u1275 \u1265\u127B \u1290\u12CD\u1362',
    password_reset_email_failed:
      '\u12E8\u12ED\u1208\u134D \u1243\u120D \u12F3\u130D\u121D \u121B\u1235\u1300\u1218\u122D \u12A2\u121C\u12ED\u120D \u1218\u120B\u12AD \u12A0\u120D\u1270\u1233\u12AB\u121D\u1362',
    password_reset_email_sent:
      '\u12A8\u1270\u1320\u1240\u1230\u12CD \u12E8\u12A2\u121C\u12ED\u120D \u12A0\u12F5\u122B\u123B \u130B\u122D \u12E8\u1270\u1308\u1293\u1298 \u1218\u1208\u12EB \u12AB\u1208\u1363 \u12E8\u12ED\u1208\u134D \u1243\u120D \u12F3\u130D\u121D \u121B\u1235\u1300\u1218\u122A\u12EB \u120A\u1295\u12AD \u12A8\u12A5\u1231 \u130B\u122D \u1270\u130B\u122D\u1277\u120D\u1362',
    password_reset_success:
      '\u12E8\u12ED\u1208\u134D \u1243\u120D \u1260\u1270\u1233\u12AB \u1201\u1294\u1273 \u12F3\u130D\u121D \u1270\u1300\u121D\u122F\u120D',
    'Something went wrong':
      '\u12E8\u1206\u1290 \u1235\u1205\u1270\u1275 \u1270\u12A8\u1235\u1277\u120D',
  },
  fr: {
    expired_token: '',
    invalid_invitation_link: '',
    invalid_login_credentials: '',
    invalid_reset_link: '',
    no_invitation_link: '',
    password_reset_email_failed: '',
    password_reset_email_sent: '',
    password_reset_success: '',
    'Something went wrong': "Un probl\xE8me s'est produit",
  },
  br: {
    expired_token: 'Token expirado.',
    invalid_invitation_link: 'Link de convite inv\xE1lido.',
    invalid_login_credentials: 'Nome de usu\xE1rio e/ou senha incorretos.',
    invalid_reset_link: 'Link de redefini\xE7\xE3o de senha inv\xE1lido.',
    no_invitation_link: 'O registro \xE9 somente por convite.',
    non_existent_user: 'Esta conta de usu\\xE1rio n\\xE3o existe',
    password_reset_email_failed:
      'Falha no envio do e-mail de redefini\xE7\xE3o de senha.',
    password_reset_email_sent:
      'Se houver uma conta associada ao endere\xE7o de e-mail fornecido, o link de redefini\xE7\xE3o de senha ser\xE1 compartilhado com ela.',
    password_reset_success: 'Redefini\xE7\xE3o de senha bem-sucedida.',
    'Something went wrong': 'Algo deu errado',
  },
};
I18N.mergeSupplementalTranslations(translations, [
  i18n_components_Authentication_ForgotPassword,
  i18n_components_Authentication_Login,
  i18n_components_Authentication_Register,
  i18n_components_Authentication_ResetPassword,
]);
export default translations;
