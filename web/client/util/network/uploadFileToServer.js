// @flow
import Promise from 'bluebird';

import ZenError from "util/ZenError";

export default function uploadFileToServer<T>(
  endpoint: string,
  formData: FormData,
): Promise<T> {
  return new Promise((resolve, reject) => {
    return fetch(endpoint, {
      method: 'POST',
      body: formData,
      cache: 'no-cache',
    })
      .then(response => {
        const jsonPromise = response.json()
        if (response.ok) {
            resolve(jsonPromise)
        } else {
          jsonPromise.then(error => {
            const { message } = error;
            if (message){
              reject(new ZenError(message));
            }
            reject(new ZenError(error));
          })
        }
      })
      .catch(error => reject(error));
  });
}
