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
import UserManagerProvider, {
  UserManagerContext,
} from 'components/Authentication/UserManagerProvider';
import {
  PasswordValidation,
  RetypePasswordValidation,
} from 'validation/schemas';
import { getAuthResponseText } from 'components/Authentication/i18n.auth';
import { getQueryParam, handleAuthRedirect } from 'util/util';
import type ZenHTTPError from 'util/ZenHTTPError';

const REDIRECT_DELAY_MS = 5000; // Delay in milliseconds before redirection

type Errors = {
  password?: string,
  retypePassword?: string,
  token?: string,
};

const ResetPassword = (): React$Node => {
  const userManager = React.useContext(UserManagerContext);
  invariant(userManager, 'userManager must be defined');
  const [password, setPassword] = useState<string>('');
  const [retypePassword, setRetypePassword] = useState<string>('');
  const [errors, setErrors] = useState<Errors>(Object.freeze({}));

  const token = React.useMemo(() => getQueryParam('token') || '', []);

  const validationObject = React.useMemo(() => {
    const schema = {
      password: PasswordValidation,
      retypePassword: RetypePasswordValidation,
    };
    if (!userManager?.enableRetypePassword) {
      delete schema.retypePassword;
    }

    return schema;
  }, [userManager]);

  const validationSchema = object().shape(validationObject);

  const handleSubmit = event => {
    event.preventDefault();
    setErrors(Object.freeze({})); // Clear previous errors

    validationSchema
      .validate({ password, retypePassword })
      .then(() => {
        AuthenticationService.resetPassword(token, password)
          .then(response => {
            Toaster.success(
              getAuthResponseText(response?.msg || 'password_reset_success'),
            );
            setTimeout(() => {
              handleAuthRedirect();
            }, REDIRECT_DELAY_MS);
          })
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
            [err.path]: err.message,
          });
        } else {
          throw err;
        }
      });
  };

  return (
    <Group.Vertical>
      <h2>{I18N.textById('Reset Password')}</h2>

      {errors.token && (
        <p className="help-block has-error">
          {getAuthResponseText(errors.token)}
        </p>
      )}

      <FormInput
        error={errors.password}
        id="password"
        labelText={I18N.text('New Password')}
        onChange={setPassword}
        type="password"
        value={password}
      />

      {userManager?.enableRetypePassword && (
        <FormInput
          error={errors.retypePassword}
          id="retypePassword"
          labelText={I18N.text('Retype Password')}
          onChange={setRetypePassword}
          type="password"
          value={retypePassword}
        />
      )}

      <Button onClick={handleSubmit}>{I18N.text('Change password')}</Button>
    </Group.Vertical>
  );
};

export default function renderToDOM(elementId: string = 'app'): void {
  const container = document.getElementById(elementId);
  invariant(container, `Element ID does not exist: ${elementId}`);
  ReactDOM.render(
    <AuthLayout>
      <UserManagerProvider>
        <ResetPassword />
      </UserManagerProvider>
    </AuthLayout>,
    container,
  );
}
