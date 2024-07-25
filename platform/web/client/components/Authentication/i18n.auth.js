// @flow
import I18N from 'lib/I18N';

export function getAuthResponseText(responseCode: string): string {
  const i18nAuthResponses = {
    expired_token: I18N.text('Expired token.', 'expired_token'),
    invalid_invitation_link: I18N.text(
      'Invalid invitation link.',
      'invalid_invitation_link',
    ),
    invalid_login_credentials: I18N.text(
      'Incorrect username and/or password.',
      'invalid_login_credentials',
    ),
    invalid_reset_link: I18N.text(
      'Invalid password reset link.',
      'invalid_reset_link',
    ),
    no_invitation_link: I18N.text(
      'Registration is invite only.',
      'no_invitation_link',
    ),
    non_existent_user: I18N.text(
      'This user account does not exist',
      'non_existent_user',
    ),
    password_reset_email_failed: I18N.text(
      'Failed to send password reset email.',
      'password_reset_email_failed',
    ),
    password_reset_email_sent: I18N.text(
      'If there is an account associated with the provided email address, the password reset link has been shared with it.',
      'password_reset_email_sent',
    ),
    password_reset_success: I18N.text(
      'Password reset successfully.',
      'password_reset_success',
    ),
  };

  return i18nAuthResponses[responseCode] || responseCode;
}
