// @flow
import Promise from 'bluebird';

import ZenError from 'util/ZenError';
import ZenHTTPError from 'util/ZenHTTPError';

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
  DELETE: 'DELETE',
  GET: 'GET',
  PATCH: 'PATCH',
  POST: 'POST',
};

export type APIVersion = $Keys<APIVersionMap>;

export interface HTTPService {
  delete<T>(apiVersion: APIVersion, path: string): Promise<T>;
  get<T>(apiVersion: APIVersion, path: string): Promise<T>;
  patch<T>(apiVersion: APIVersion, path: string, data?: mixed): Promise<T>;
  post<T>(apiVersion: APIVersion, path: string, data?: mixed): Promise<T>;
}

export const API_VERSION: APIVersionMap = {
  NONE: 'NONE',
  V1: 'V1',
  V2: 'V2',
};

const HTTP_METHOD: HTTPMethodMap = {
  DELETE: 'DELETE',
  GET: 'GET',
  PATCH: 'PATCH',
  POST: 'POST',
};

export const API_VERSION_TO_PREFIX: $ObjMap<APIVersionMap, () => string> = {
  NONE: '',
  V1: '/api',
  V2: '/api2',
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
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(data),
        dataType: 'json',
        timeout: 300 * 1000, // milliseconds
        type: method,
        url: completePath,

        // eslint-disable-next-line sort-keys-shorthand/sort-keys-shorthand
        success: response => {
          // TODO - Remove this check. Only our legacy APIs even pass
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

        // eslint-disable-next-line sort-keys-shorthand/sort-keys-shorthand
        error: request => {
          const { responseJSON, status } = request;
          reject(
            new ZenHTTPError(
              responseJSON?.message,
              status,
              responseJSON?.errors,
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
