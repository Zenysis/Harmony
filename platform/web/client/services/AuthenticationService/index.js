// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import autobind from 'decorators/autobind';
import type { HTTPService } from 'services/APIService';

export type UserManagerInfo = {
  enableChangePassword: boolean,
  enableChangeUsername: boolean,
  enableEmail: boolean,
  enableRetypePassword: boolean,
  enableUsername: boolean,
};

class AuthenticationService {
  _httpService: HTTPService;
  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  @autobind
  login(email: string, password: string, rememberMe: boolean): Promise<void> {
    return this._httpService.post(
      API_VERSION.V2,
      '/authentication/login?set_cookie=true',
      {
        email,
        password,
        remember_me: rememberMe,
      },
    );
  }

  @autobind
  register(
    email: string,
    firstName: string,
    lastName: string,
    password: string,
    inviteToken: string,
  ): Promise<void> {
    return this._httpService.post(API_VERSION.V2, '/authentication/register', {
      email,
      password,
      firstname: firstName,
      invite_token: inviteToken,
      lastname: lastName,
    });
  }

  @autobind
  forgotPassword(email: string): Promise<void> {
    return this._httpService.post(
      API_VERSION.V2,
      '/authentication/forgot_password',
      {
        email,
      },
    );
  }

  @autobind
  resetPassword(token: string, password: string): Promise<void> {
    return this._httpService.post(
      API_VERSION.V2,
      '/authentication/reset_password',
      {
        password,
        token,
      },
    );
  }

  @autobind
  getRegistrationData(token: string): Promise<void> {
    return this._httpService.get(
      API_VERSION.V2,
      `/authentication/registration_data?token=${token}`,
    );
  }

  @autobind
  userManagerInfo(): Promise<UserManagerInfo> {
    return this._httpService.get(
      API_VERSION.V2,
      '/authentication/user_manager_info',
    );
  }
}

export default (new AuthenticationService(APIService): AuthenticationService);
