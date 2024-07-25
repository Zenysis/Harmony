// @flow
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';
import { object, ValidationError } from 'yup';

import AuthLayout from 'components/Authentication/AuthLayout';
import AuthenticationService from 'services/AuthenticationService';
import Button from 'components/ui/Button';
import FormInput from 'components/Authentication/FormInput';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Toaster from 'components/ui/Toaster';
import { EmailValidation } from 'validation/schemas';
import { getAuthResponseText } from 'components/Authentication/i18n.auth';
import type ZenHTTPError from 'util/ZenHTTPError';

const REDIRECT_DELAY_MS = 5000; // Delay in milliseconds before redirection

type Errors = {
  email?: string,
};

const ForgotPassword = (): React$Node => {
  const [email, setEmail] = useState<string>('');
  const [errors, setErrors] = useState<Errors>(Object.freeze({}));

  const validationSchema = object({
    email: EmailValidation,
  });

  const handleSubmit = event => {
    event.preventDefault();
    setErrors(Object.freeze({})); // Clear previous errors

    validationSchema
      .validate({ email })
      .then(() => {
        AuthenticationService.forgotPassword(email)
          .then(response => {
            // show success message
            Toaster.success(
              getAuthResponseText(response?.msg || 'password_reset_email_sent'),
            );
            // redirect to login page after 5 seconds
            setTimeout(() => {
              window.location.href = '/login';
            }, REDIRECT_DELAY_MS);
          })
          .catch((response: ZenHTTPError) => {
            const msg =
              response.message && response.message === 'non_existent_user'
                ? I18N.textById('non_existent_user')
                : I18N.textById('password_reset_email_failed');
            Toaster.error(msg);
          });
      })
      .catch(err => {
        if (err instanceof ValidationError) {
          setErrors({
            ...errors,
            [err.path]: err.message,
          });
        }
      });
  };

  return (
    <Group.Vertical>
      <h2>{I18N.text('Forgot Password')}</h2>

      <FormInput
        error={errors.email}
        id="email"
        labelText={I18N.textById('Email Address')}
        onChange={setEmail}
        type="email"
        value={email}
      />

      <Button onClick={handleSubmit}>{I18N.text('Send reset link')}</Button>
    </Group.Vertical>
  );
};

export default function renderToDOM(elementId: string = 'app') {
  const container = document.getElementById(elementId);
  invariant(container, `Element ID does not exist: ${elementId}`);
  ReactDOM.render(
    <AuthLayout>
      <ForgotPassword />
    </AuthLayout>,
    container,
  );
}
