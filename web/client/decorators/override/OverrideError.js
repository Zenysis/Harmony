// @flow
import { replaceAll } from 'util/stringUtil';

/**
 * OverrideError is used exclusively in the @override decorator to signal
 * misuse of the decorator, or that a function is not being correctly overridden
 * which could potentially lead to bugs.
 *
 * An OverrideError needs to receive a message, and an object containing
 * the parent & child classes, and the function name being overridden.
 * A message can contain CHILD and PARENT string placeholders which will be
 * interpolated and filled out with the correct class and function names.
 */

export type OverrideErrorOptions = {
  parent: Object,
  child: Object,
  funcName: string,
};

function getFormattedFuncName(obj: Object, funcName: string) {
  if (obj.constructor === Function) {
    // this is the static class itself, not an instance
    return `${obj.name}#static#${funcName}`;
  }

  // we're looking at an *instance* of a class, not the static class
  return `${obj.constructor.name}#${funcName}`;
}

function interpolateMessage(msg: string, options: OverrideErrorOptions) {
  const { parent, child, funcName } = options;
  const newMsg = replaceAll(
    msg,
    'PARENT',
    getFormattedFuncName(parent, funcName),
  );
  return replaceAll(
    newMsg,
    'CHILD',
    getFormattedFuncName(child, funcName),
  );
}

export default class OverrideError extends SyntaxError {
  constructor(msg: string, options: OverrideErrorOptions) {
    super(interpolateMessage(msg, options));
  }
}
