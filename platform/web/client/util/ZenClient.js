import Promise from 'bluebird';

import ZenError from 'util/ZenError';

// Allow our promises to be cancelable so that their handlers can be
// cleaned up if a component is unmounted before the promise resolves
Promise.config({ cancellation: true });

const ZenClient = {
  post(path, data = {}) {
    return new Promise((resolve, reject) => {
      $.ajax({
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(data),
        dataType: 'json',
        timeout: 300 * 1000, // milliseconds
        type: 'POST',
        url: `/api/${path}`,
        // eslint-disable-next-line sort-keys-shorthand/sort-keys-shorthand
        success(response) {
          // TODO: Handle failure like 404 or 500.
          if (!response) {
            reject(new ZenError('Server returned no response'));
            return;
          }

          if (response.success === false) {
            reject(new ZenError(response.data));
            return;
          }

          resolve(response.data);
        },
        // eslint-disable-next-line no-unused-vars,sort-keys-shorthand/sort-keys-shorthand
        error(request, status, error) {
          reject(new ZenError('An error occurred on the server'));
        },
      });
    });
  },
  request(path) {
    return new Promise((resolve, reject) => {
      $.getJSON(`/api/${path}`, response => {
        // TODO: Handle failure like 404 or 500.
        if (!response) {
          reject(new Error('Server returned no response'));
          return;
        }

        if (response.success === false) {
          reject(new ZenError(response.data));
          return;
        }

        resolve(response.data);
      });
    });
  },
};

export default ZenClient;
