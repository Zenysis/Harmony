// @flow
import Promise from 'bluebird';

import I18N from 'lib/I18N';

type FileOperationMap = {
  readonly: 'readonly',
  readwrite: 'readwrite',
};

type FileOperation = $Keys<FileOperationMap>;
type ObjectStoreOptions = {
  autoIncrement?: boolean,
  keyPath?: ?(string | $ReadOnlyArray<string>),
};

const FILE_OPERATIONS: FileOperationMap = {
  readonly: 'readonly',
  readwrite: 'readwrite',
};

// TODO: make this service more generic to allow multiple
// different dbs for different applications
const SESSION_DB_NAME = `${window.__JSON_FROM_BACKEND.deploymentName}_aqt_sessions`;
const SESSION_DB_VER = 1;

class BrowserSessionService {
  dbVersion: number;
  indexedDB: IDBFactory;
  indexString: string;
  keyObj: ObjectStoreOptions;
  objectStoreName: string;
  _db: IDBDatabase | void;
  _dbSupported: boolean;

  constructor(
    keyObj: ObjectStoreOptions,
    indexString: string,
    objectStoreName: string,
    dbVersion: number,
    errorWarning: string,
  ) {
    this.objectStoreName = objectStoreName;
    this.dbVersion = dbVersion;
    this._db = undefined;
    // NOTE: Get various browser implementations of indexedDB
    const indexedDB =
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB;
    if (!indexedDB) {
      window.toastr.error(errorWarning);
      this._dbSupported = false;
      return;
    }
    this.indexedDB = indexedDB;
    this.indexString = indexString;
    this.keyObj = keyObj;
    this._dbSupported = true;
  }

  /*
   * Loads a storage object. Creates one if one is not present. Note that the
   * caller should first check to see if browser is compatible before calling
   */
  loadStore(): Promise<IDBDatabase> {
    if (this._db) {
      return Promise.resolve(this._db);
    }

    return new Promise(resolve => {
      const request = this.indexedDB.open(this.objectStoreName, this.dbVersion);

      request.onsuccess = () => {
        // $FlowIssue[incompatible-type] Flow's indexedDB annotation is incorrect. IDBOpenDBRequest should specify overwrite result as an IDBDatabase, not IDBObjectStore
        this._db = request.result;
        resolve(this._db);
      };

      request.onupgradeneeded = event => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.objectStoreName)) {
          const objectStore = db.createObjectStore(
            this.objectStoreName,
            this.keyObj,
          );
          // NOTE: Currently only supports one index
          objectStore.createIndex(this.indexString, this.indexString);
        }
      };
    });
  }

  getObjectStore(fileOperation: FileOperation): Promise<IDBObjectStore> {
    return this.loadStore().then(db => {
      const transaction = db.transaction([this.objectStoreName], fileOperation);
      return transaction.objectStore(this.objectStoreName);
    });
  }

  // TODO: fix the type annotations here to not use `any` and to
  // instead enforce a generic type
  getData(key: string): Promise<any> {
    if (!this._dbSupported) {
      return Promise.resolve();
    }

    return this.getObjectStore(FILE_OPERATIONS.readonly).then(
      objectStore =>
        new Promise((resolve, reject) => {
          const objectStoreReq = objectStore.get(key);
          objectStoreReq.onsuccess = () => {
            resolve(objectStoreReq.result);
          };
          objectStoreReq.onerror = err => {
            reject(err);
          };
        }),
    );
  }

  putData(item: any): Promise<void> {
    if (!this._dbSupported) {
      return Promise.resolve();
    }

    return this.getObjectStore(FILE_OPERATIONS.readwrite).then(
      objectStore =>
        new Promise((resolve, reject) => {
          const objectStoreReq = objectStore.put(item);
          // TODO: We may want to return the object as well
          objectStoreReq.onsuccess = () => {
            resolve();
          };
          objectStoreReq.onerror = err => {
            reject(err);
          };
        }),
    );
  }

  deleteData(key: string): Promise<void> {
    if (!this._dbSupported) {
      return Promise.resolve();
    }

    return this.getObjectStore(FILE_OPERATIONS.readwrite).then(
      objectStore =>
        new Promise((resolve, reject) => {
          const objectStoreReq = objectStore.delete(key);
          // TODO: Maybe return the value here in the future
          objectStoreReq.onsuccess = () => {
            resolve();
          };
          objectStoreReq.onerror = err => {
            reject(err);
          };
        }),
    );
  }
}

export default (new BrowserSessionService(
  { keyPath: 'username' },
  'username',
  SESSION_DB_NAME,
  SESSION_DB_VER,
  I18N.text(
    'Your browser does not support persisting query sessions. Refreshing your browser will reset your queries.',
  ),
): BrowserSessionService);
