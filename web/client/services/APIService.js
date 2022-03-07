// @flow
import Promise from 'bluebird';

import ZenError from 'util/ZenError';
import ZenHTTPError, { HTTP_STATUS_CODE } from 'util/ZenHTTPError';

// Allow our promises to be cancelable so that their handlers can be cleaned up
// if a component is unmounted before the promise resolves. Also disable
// longStackTraces in dev (prod has them disabled by default). They incur a
// significant performance penalty.
Promise.config({ cancellation: true, longStackTraces: false });

type APIVersionMap = {
  NONE: 'NONE',
  V1: 'V1',
  V2: 'V2',
};

type HTTPMethodMap = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

export type APIVersion = $Keys<APIVersionMap>;

export interface HTTPService {
  get<T>(apiVersion: APIVersion, path: string): Promise<T>;
  post<T>(apiVersion: APIVersion, path: string, data?: mixed): Promise<T>;
  patch<T>(apiVersion: APIVersion, path: string, data?: mixed): Promise<T>;
  delete<T>(apiVersion: APIVersion, path: string): Promise<T>;
}

export const API_VERSION: APIVersionMap = {
  NONE: 'NONE',
  V1: 'V1',
  V2: 'V2',
};

const HTTP_METHOD: HTTPMethodMap = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

export const API_VERSION_TO_PREFIX: $ObjMap<APIVersionMap, () => string> = {
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
        success: response => {
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

        error: request => {
          const { status, responseText } = request;
          console.error(`HTTP ERROR CODE: ${String(status)}`, responseText);

          if (status) {
            if (status === HTTP_STATUS_CODE.CONFLICT) {
              reject(new ZenHTTPError('That name is already taken.', status));
            } else if (status === HTTP_STATUS_CODE.FORBIDDEN) {
              reject(
                new ZenHTTPError(
                  'You do not have authorization to perform this action.',
                  status,
                ),
              );
            } else if (status === HTTP_STATUS_CODE.UNAUTHORIZED) {
              reject(
                new ZenHTTPError(
                  'You must sign in to perform this action.',
                  status,
                ),
              );
            } else if (status === HTTP_STATUS_CODE.BAD_REQUEST) {
              reject(
                new ZenHTTPError('An invalid input was specified.', status),
              );
            } else if (status === HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR) {
              reject(
                new ZenHTTPError('An error occurred on the server.', status),
              );
            } else if (status === HTTP_STATUS_CODE.NOT_FOUND) {
              reject(new ZenHTTPError('Not found.', status));
            } else if (status === HTTP_STATUS_CODE.SUCCESS) {
              reject(
                new ZenHTTPError(
                  'The server responded with a success code but the response is not of a valid json format.',
                  status,
                ),
              );
            }
            return;
          }

          reject(
            new ZenHTTPError(
              'An unknown error occurred on the server.',
              status,
            ),
          );
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

export default (new APIService(): APIService);
