// @flow
import Promise from 'bluebird';

import ZenError from 'util/ZenError';

// Allow our promises to be cancelable so that their handlers can be cleaned up
// if a component is unmounted before the promise resolves. Also disable
// longStackTraces in dev (prod has them disabled by default). They incur a
// significant performance penalty.
Promise.config({ cancellation: true, longStackTraces: false });

export type APIVersion = 'NONE' | 'V1' | 'V2';

type HTTPError =
  | 'BAD_REQUEST'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'INTERNAL_SERVER_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED';

type HTTPMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface HTTPService {
  get<T>(apiVersion: APIVersion, path: string): Promise<T>;
  post<T>(apiVersion: APIVersion, path: string, data?: mixed): Promise<T>;
  patch<T>(apiVersion: APIVersion, path: string, data?: mixed): Promise<T>;
  delete<T>(apiVersion: APIVersion, path: string): Promise<T>;
}

export const API_VERSION: { [APIVersion]: APIVersion } = {
  NONE: 'NONE',
  V1: 'V1',
  V2: 'V2',
};

const HTTP_ERROR: { [HTTPError]: number } = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 503,
};

const HTTP_METHOD: { [HTTPMethod]: HTTPMethod } = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

export const API_VERSION_TO_PREFIX: { [APIVersion]: string } = {
  V1: '/api',
  V2: '/api2',
  NONE: '',
};

function sanitizeUrl(url: string): string {
  // remove the leading and trailing slashes
  return url.replace(/^\/|\/$/g, '');
}

class APIService implements HTTPService {
  static dispatch<T>(
    apiVersion: APIVersion,
    path: string,
    method: string,
    data?: mixed = {},
  ): Promise<T> {
    const sanitizedPath = sanitizeUrl(path);
    const versionPrefix = API_VERSION_TO_PREFIX[apiVersion];
    const completePath = `${versionPrefix}/${sanitizedPath}`;

    return new Promise((resolve, reject) => {
      $.ajax({
        type: method,
        url: completePath,
        data: JSON.stringify(data),
        timeout: 300 * 1000, // milliseconds
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success(response) {
          // TODO(vedant) - Remove this check. Only our legacy APIs even pass
          // this useless value.
          if (response && response.success === false) {
            console.error(response);
            reject(
              new ZenError(
                `An unknown error occurred on the server.${JSON.stringify(
                  response,
                )}`,
              ),
            );
          }
          resolve(response);
        },

        error(request) {
          const { status, responseText } = request;
          const details = responseText ? ` More details: ${responseText}` : '';
          if (status === HTTP_ERROR.CONFLICT) {
            reject(new ZenError(`That name is already taken.${details}'`));
          } else if (status === HTTP_ERROR.FORBIDDEN) {
            reject(
              new ZenError(
                `You do not have authorization to perform this action.${details}`,
              ),
            );
          } else if (status === HTTP_ERROR.UNAUTHORIZED) {
            reject(
              new ZenError(
                `You must sign in to perform this action.${details}`,
              ),
            );
          } else if (status === HTTP_ERROR.BAD_REQUEST) {
            reject(new ZenError(`An invalid input was specified.${details}`));
          } else if (status === HTTP_ERROR.INTERNAL_SERVER_ERROR) {
            reject(new ZenError(`An error occurred on the server.${details}'`));
          } else if (status === HTTP_ERROR.NOT_FOUND) {
            reject(new ZenError(`Not found.${details}'`));
          } else {
            console.error(status, responseText);
            reject(
              new ZenError(
                `An unknown error occurred on the server.${details}`,
              ),
            );
          }
        },
      });
    });
  }

  get<T>(apiVersion: APIVersion, path: string): Promise<T> {
    return APIService.dispatch(apiVersion, path, HTTP_METHOD.GET);
  }

  post<T>(apiVersion: APIVersion, path: string, data?: mixed = {}): Promise<T> {
    return APIService.dispatch(apiVersion, path, HTTP_METHOD.POST, data);
  }

  patch<T>(
    apiVersion: APIVersion,
    path: string,
    data?: mixed = {},
  ): Promise<T> {
    return APIService.dispatch(apiVersion, path, HTTP_METHOD.PATCH, data);
  }

  delete<T>(apiVersion: APIVersion, path: string): Promise<T> {
    return APIService.dispatch(apiVersion, path, HTTP_METHOD.DELETE);
  }
}

export default new APIService();
