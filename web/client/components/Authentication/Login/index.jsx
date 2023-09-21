// @flow

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';
import { object, string, ValidationError } from 'yup';

import AuthLayout from 'components/Authentication/AuthLayout';
import AuthenticationService from 'services/AuthenticationService';
import Button from 'components/ui/Button';
import Checkbox from 'components/ui/Checkbox';
import FormInput from 'components/Authentication/FormInput';
import Group from 'components/ui/Group';
import HypertextLink from 'components/ui/HypertextLink';
import I18N from 'lib/I18N';
import Toaster from 'components/ui/Toaster';
import { EmailValidation } from 'validation/schemas';
import { getAuthResponseText } from 'components/Authentication/i18n.auth';
import { getQueryParam, handleAuthRedirect } from 'util/util';
import type ZenHTTPError from 'util/ZenHTTPError';

type Errors = {
  __all__?: string,
  email?: string,
  password?: string,
};

const Login = (): React$Node => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>(Object.freeze({}));

  const sessionTimeout = getQueryParam('timeout'); // get the 'sessionTimeout' parameter

  const validationSchema = object({
    email: EmailValidation,
    password: string()
      // NOTE: (Katuula) This is to get around the min length validation on current system
      .min(2, I18N.text('Password must be at least 2 characters'))
      .required(I18N.text('Password is required')),
  });

  React.useEffect(() => {
    if (errors.__all__) {
      Toaster.error(errors.__all__);
    }
  }, [errors]);

  const handleSubmit = e => {
    e.preventDefault();
    setErrors(Object.freeze({})); // Clear previous errors

    validationSchema
      .validate({ email, password }) // will return a Promise
      .then(() => {
        AuthenticationService.login(email, password, rememberMe)
          .then(handleAuthRedirect)
          .catch((response: ZenHTTPError) => {
            response.errors?.forEach(error => {
              Object.entries(error.validationOf).forEach(([field]) => {
                setErrors(prevErrors => ({
                  ...prevErrors,
                  [field]: getAuthResponseText(error.validationOf[field]),
                }));
              });
            });
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
    <Group.Vertical className="text-center" testId="login-page">
      <h2>
        {sessionTimeout
          ? I18N.text('Your session timed out. Log in to continue.')
          : I18N.textById('Sign In')}
      </h2>
      <FormInput
        error={errors.email}
        id="email"
        labelText={I18N.textById('Email Address')}
        onChange={setEmail}
        type="email"
        value={email}
      />
      <FormInput
        error={errors.password}
        id="password"
        labelText={I18N.textById('Password')}
        onChange={setPassword}
        type="password"
        value={password}
      />
      <HypertextLink url="/user/forgot-password">
        {I18N.text('Forgot your Password?')}
      </HypertextLink>

      <Group.Horizontal alignItems="center" flex justifyContent="space-between">
        <Checkbox
          label={I18N.text('Remember Me')}
          onChange={() => setRememberMe(!rememberMe)}
          value={rememberMe}
        />
        <Button onClick={handleSubmit} testId="sign-btn">
          {I18N.text('Sign In')}
        </Button>
      </Group.Horizontal>
    </Group.Vertical>
  );
};

export default function renderToDOM(elementId: string = 'app') {
  const container = document.getElementById(elementId);
  invariant(container, `Element ID does not exist: ${elementId}`);
  ReactDOM.render(
    <AuthLayout>
      <Login />
    </AuthLayout>,
    container,
  );
}
