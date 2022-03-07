// @flow
/* eslint-disable sort-keys */
export const HTTP_STATUS_CODE = Object.freeze({
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
});

/**
 * HTTP Error type that tracks both a `message` and a `statusCode` so we can
 * have more information about what went wrong in a server-side Error response.
 */
export default class ZenHTTPError extends Error {
  statusCode: number | void;

  constructor(message: string, statusCode: number | void) {
    super(message);
    this.statusCode = statusCode;
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
}
