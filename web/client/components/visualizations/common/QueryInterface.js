// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import PromiseQueue from 'lib/Queue/PromiseQueue';
import type { APIVersion } from 'services/APIService';

// Allow our promises to be cancelable so that their handlers can be
// cleaned up if a component is unmounted before the promise resolves
// TODO(stephen): Can this be configured globally?
Promise.config({ cancellation: true });

// Very naive query cache implementation that uses endpoint + JSON request
// as the cache key.
// NOTE: This cache does not know if the server is using a new pipeline
// version. If the server changes datasources and the user does not refresh,
// the data being returned could be out of date. This is an OK tradeoff for
// now.
const QUERY_CACHE: { [string]: mixed } = {};

// Store pending promises so that we don't kick off duplicate requests
const PENDING: { [string]: Promise<*> } = {};

// How many queries we allow to run at the same time.
const MAX_CONCURRENT_QUERIES = 6;
const PROMISE_QUEUE = new PromiseQueue(MAX_CONCURRENT_QUERIES);

export default class QueryInterface<Request, Response> {
  apiVersion: APIVersion;
  endpoint: string;
  _request: Request;
  +_useCache: boolean;

  constructor(
    apiVersion: APIVersion,
    endpoint: string,
    useCache: boolean = true,
  ) {
    this.apiVersion = apiVersion;
    this.endpoint = endpoint;
    this._useCache = useCache;
  }

  buildRequest() {
    // eslint-disable-next-line no-console
    console.error('Must be implemented by subclass');
    return this;
  }

  run(): Promise<Response> {
    const cacheKey = this.getCacheKey();

    // Check first to see if this request has already been made and a
    // cached value can be returned
    if (this._useCache && QUERY_CACHE[cacheKey]) {
      return Promise.resolve(QUERY_CACHE[cacheKey]);
    }

    // Check if an identical request has already been initiated
    // and is still pending
    if (PENDING[cacheKey]) {
      return PENDING[cacheKey];
    }

    // If we don't have a cached value and an identical request is not
    // currently in progress, initiate a new request.
    // Build the request promise inside a callback so that we can use a promise
    // queue to limit the number of concurrent requests.
    const requestPromiseThunk = (): Promise<Response> =>
      APIService.post(this.apiVersion, this.endpoint, this._request)
        // TODO(stephen): Surface these errors in a nice way
        .catch(e => {
          // eslint-disable-next-line no-console
          console.error(e.message);
          analytics.track('Query Error', e.message);
          if (window.Rollbar !== undefined) {
            window.Rollbar.error(e);
          }
        });

    const queuedPromise = PROMISE_QUEUE.add(requestPromiseThunk)
      // Set a disposer that cleans up the pending promise cache
      .disposer(() => {
        delete PENDING[cacheKey];
      });

    // Build the wrapped promise and add it to the pending promise cache
    const promise = Promise.using(queuedPromise, response => {
      // Only process the response if no error was thrown. The response is only
      // empty if APIService caught an error.
      // TODO(stephen): Update visualizations to show useful error messages
      // when this happens.
      if (response !== undefined) {
        // If a legacy V1 API endpoint is in use, unpack the data result from
        // the response. V2 endpoints do not nest the response.
        const data =
          this.apiVersion === API_VERSION.V1 ? response.data : response;
        return this.populateCache(cacheKey, data);
      }

      return undefined;
    });

    // Add noop callback to work around a quirk (bug?) in bluebird:
    // If there is only one child promise, and that promise is cancelled,
    // the parent promise will also be cancelled. We never want the
    // parent promise to be cancelled since caching and completing the
    // query call is much more useful than kicking off the query call again.
    promise.then(() => {});

    PENDING[cacheKey] = promise;
    return promise;
  }

  // Create a cache key from the endpoint + request object
  // TODO(stephen): JSON.stringify is not stable, so we could generate
  // invalid cache keys for the same object. Figure out a better solution.
  getCacheKey(): string {
    const requestKey = JSON.stringify(this._request) || '';
    return `${this.endpoint}__${requestKey}`;
  }

  populateCache(cacheKey: string, value: Response): Response {
    if (this._useCache) {
      QUERY_CACHE[cacheKey] = value;
    }
    return value;
  }

  setRequest(request: Request) {
    this._request = request;
    return this;
  }
}
