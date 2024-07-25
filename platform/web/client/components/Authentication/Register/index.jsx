// @flow
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';
import { object, string, ValidationError } from 'yup';

import AuthLayout from 'components/Authentication/AuthLayout';
import AuthenticationService from 'services/AuthenticationService';
import Button from 'components/ui/Button';
import FormInput from 'components/Authentication/FormInput';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import UserManagerProvider, {
  UserManagerContext,
} from 'components/Authentication/UserManagerProvider';
import {
  PasswordValidation,
  RetypePasswordValidation,
  EmailValidation,
} from 'validation/schemas';
import { getAuthResponseText } from 'components/Authentication/i18n.auth';
import { getQueryParam, handleAuthRedirect } from 'util/util';
import type ZenHTTPError from 'util/ZenHTTPError';

type Errors = {
  email?: string,
  firstName?: string,
  lastName?: string,
  password?: string,
  retypePassword?: string,
  token?: string,
};

const Register = (): React$Node => {
  const userManager = React.useContext(UserManagerContext);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [retypePassword, setRetypePassword] = useState<string>('');
  const [errors, setErrors] = useState<Errors>(Object.freeze({}));

  const token = getQueryParam('token') || ''; // get the 'token' parameter

  React.useEffect(() => {
    AuthenticationService.getRegistrationData(token)
      .then(data => {
        if (data) {
          setEmail(data.username);
        }
      })
      .catch((error: ZenHTTPError) => {
        if (error.isBadRequest() || error.isNotFound()) {
          // Redirect the user to the login page
          window.location.href = '/login';
        }
      });
  }, [token]);

  const validationObject = React.useMemo(() => {
    const schema = {
      email: EmailValidation,
      firstName: string().required(I18N.text('First name is required')),
      lastName: string().required(I18N.text('Last name is required')),
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
      .validate({ email, firstName, lastName, password, retypePassword })
      .then(() => {
        AuthenticationService.register(
          email,
          firstName,
          lastName,
          password,
          token,
        )
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
            [err.path]: err.message,
          });
        }
      });
  };

  return (
    <Group.Vertical>
      <h2>{I18N.textById('Register')}</h2>

      {errors.token && <p className="help-block has-error">{errors.token}</p>}

      <FormInput
        disabled={!userManager?.enableEmail}
        error={errors.email}
        id="email"
        labelText={I18N.text('Email Address')}
        onChange={setEmail}
        type="email"
        value={email}
      />

      <FormInput
        error={errors.firstName}
        id="firstName"
        labelText={I18N.text('First Name')}
        onChange={setFirstName}
        type="text"
        value={firstName}
      />

      <FormInput
        error={errors.lastName}
        id="lastName"
        labelText={I18N.text('Last Name')}
        onChange={setLastName}
        type="text"
        value={lastName}
      />

      <FormInput
        error={errors.password}
        id="password"
        labelText={I18N.textById('Password')}
        onChange={setPassword}
        type="password"
        value={password}
      />

      {userManager?.enableRetypePassword && (
        <FormInput
          error={errors.retypePassword}
          id="retypePassword"
          labelText={I18N.text('Please re-type your password')}
          onChange={setRetypePassword}
          type="password"
          value={retypePassword}
        />
      )}

      <Button onClick={handleSubmit}>{I18N.text('Register')}</Button>
    </Group.Vertical>
  );
};

export default function renderToDOM(elementId: string = 'app'): void {
  const container = document.getElementById(elementId);
  invariant(container, `Element ID does not exist: ${elementId}`);
  ReactDOM.render(
    <AuthLayout>
      <UserManagerProvider>
        <Register />
      </UserManagerProvider>
    </AuthLayout>,
    container,
  );
}
