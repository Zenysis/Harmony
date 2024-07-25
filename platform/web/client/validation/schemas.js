import { string, ref } from 'yup';

import I18N from 'lib/I18N';

export const PasswordValidation = string()
  .required(I18N.text('Password required'))
  .min(8, I18N.text('Password must be at least 8 characters long.'))
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_-])(?=.{8,})/,
    I18N.text(
      'Password must include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
    ),
  );

export const RetypePasswordValidation = string()
  .required(I18N.text('Retype password required'))
  .oneOf([ref('password')], I18N.text('Passwords do not match'));

export const EmailValidation = string()
  .email(I18N.text('Invalid email address'))
  .required(I18N.text('Email required'));
