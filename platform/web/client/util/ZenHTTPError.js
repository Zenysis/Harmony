// @flow
import I18N from 'lib/I18N';

/* eslint-disable sort-keys-shorthand/sort-keys-shorthand */
export const HTTP_STATUS_CODE = Object.freeze({
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
});
/* eslint-enable */

type HTTPError = {
  message: string,
  path: $ReadOnlyArray<string>,
  validationOf: { [string]: string },
};

/**
 * HTTP Error type that tracks both a `message` and a `statusCode` so we can
 * have more information about what went wrong in a server-side Error response.
 */
export default class ZenHTTPError extends Error {
  statusCode: number | void;
  errors: $ReadOnlyArray<HTTPError> | void;

  constructor(
    message: string | void,
    statusCode: number | void,
    errors: $ReadOnlyArray<HTTPError> | void,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }

  isBadRequest(): boolean {
    return this.statusCode === HTTP_STATUS_CODE.BAD_REQUEST;
  }

  isUnauthorized(): boolean {
    return this.statusCode === HTTP_STATUS_CODE.UNAUTHORIZED;
  }

  isForbidden(): boolean {
    return this.statusCode === HTTP_STATUS_CODE.FORBIDDEN;
  }

  isNotFound(): boolean {
    return this.statusCode === HTTP_STATUS_CODE.NOT_FOUND;
  }

  isConflict(): boolean {
    return this.statusCode === HTTP_STATUS_CODE.CONFLICT;
  }

  isInternalServerError(): boolean {
    return this.statusCode === HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR;
  }

  standardErrorMessage(): string {
    if (this.isBadRequest()) {
      return I18N.text('An invalid input was specified.');
    }
    if (this.isUnauthorized()) {
      return I18N.text('You must sign in to perform this action.');
    }
    if (this.isForbidden()) {
      return I18N.text('You do not have authorization to perform this action.');
    }
    if (this.isNotFound()) {
      return I18N.text('Not found.');
    }
    if (this.isConflict()) {
      return I18N.text('That name is already taken.');
    }
    if (this.isInternalServerError()) {
      return I18N.text('An error occurred on the server.');
    }

    return I18N.text('An unknown error occurred on the server.');
  }
}
