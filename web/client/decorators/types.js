// @flow
export type PropertyDescriptor<T> = {
  value: T,
  writable: boolean,
  enumerable: boolean,
  configurable: boolean,
  get: () => T,
  set: (T) => void,
};
