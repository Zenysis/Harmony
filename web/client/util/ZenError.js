// @flow

/**
 * Generic error type that can have custom data objects
 * (Built-in JS Error types don't let you add custom data, and sometimes we
 * might need it if we wanted to have additional information about what went
 * wrong in a server-side Error response)
 *   errorData: string|object
 * If it's an object, the Error message must be in errorData.message,
 *   otherwise the passed string will be taken as the error message.
 */
export default class ZenError extends Error {
  data: { message: string, ... } | void;
  name: string;

  constructor(errorData: string | { message: string, ... }) {
    const errMsg =
      typeof errorData === 'string' ? errorData : errorData.message;
    super(errMsg);
    this.data = typeof errorData === 'string' ? undefined : errorData;
    this.name = 'ZenError';
  }
}
