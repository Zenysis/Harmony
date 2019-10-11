import Promise from 'bluebird';

import ZenError from 'util/ZenError';

// Allow our promises to be cancelable so that their handlers can be
// cleaned up if a component is unmounted before the promise resolves
Promise.config({ cancellation: true });

const ZenClient = {
  request(path) {
    return new Promise((resolve, reject) => {
      $.getJSON(`/api/${path}`, response => {
        // TODO(ian): Handle failure like 404 or 500.
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

  post(path, data = {}) {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: 'POST',
        url: `/api/${path}`,
        data: JSON.stringify(data),
        timeout: 300 * 1000, // milliseconds
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success(response) {
          // TODO(ian): Handle failure like 404 or 500.
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
        // eslint-disable-next-line no-unused-vars
        error(request, status, error) {
          reject(new ZenError('An error occurred on the server'));
        },
      });
    });
  },
};

export default ZenClient;
