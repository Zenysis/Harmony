// @flow

const NATIVE_LOCALSTORAGE_AVAILABLE: boolean = (() => {
  // LocalStorage may not be available on old browsers, or if browser policy
  // disallows it (e.g. in an iframe with third-party cookies disabled).
  try {
    if (typeof window.localStorage === 'undefined') {
      return false;
    }
    window.localStorage.setItem('__zenysisTestLocalStorage', '1');
    return window.localStorage.getItem('__zenysisTestLocalStorage') === '1';
  } catch (err) {
    return false;
  }
})();

if (!NATIVE_LOCALSTORAGE_AVAILABLE) {
  // eslint-disable-next-line no-console
  console.warn('localStorage is not available. Using shim!');
}

class LocalStorageService {
  _storage: { [string]: string };

  constructor() {
    this._storage = {};
  }

  getItem(key: string): ?string {
    return this._storage[key];
  }

  setItem(key: string, val: string) {
    this._storage[key] = val;
  }

  removeItem(key: string) {
    delete this._storage[key];
  }
}

const exportVal: Storage | LocalStorageService = NATIVE_LOCALSTORAGE_AVAILABLE
  ? window.localStorage
  : new LocalStorageService();
export default exportVal;
