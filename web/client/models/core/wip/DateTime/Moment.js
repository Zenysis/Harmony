// @flow
import moment from 'moment';
/* eslint-disable no-use-before-define */

// This model is an immutable wrapper around the momentjs library.
/**
 * The Moment model provides an immutable wrapper around the momentjs library.
 * Its API is identical to momentjs, so using Moment instances should be the
 * same. The only differences is usage of the `new` operator when creating a
 * new instance. Moment.create is provided for convenience to simplify this.
 *
 * NOTE(pablo): Even though all of moment's API is copied onto this class, Flow
 * does not recognize that fact. So we have to manually specify the public
 * functions we want to expose. Whenever there is a new momentjs function you
 * want to expose for Flow, add it to this class.
 *
 * Example:
 * Return today's date formatted as YYYY-MM-DD:
 *  [momentjs] - moment().format('YYYY-MM-DD')
 *  [Moment]   - Moment.create().format('YYYY-MM-DD')
 *
 * Parse a string date into a moment object:
 *  [momentjs] - moment('20111031', 'YYYYMMDD')
 *  [Moment]   - Moment.create('20111031', 'YYYYMMDD')
 */

type MomentDateInitializer =
  | string
  | number
  | moment$Moment
  | moment$MomentOptions
  | Date
  | Array<number>
  | void
  | null;

type MomentInitializerFns = (() => Moment) &
  (MomentDateInitializer => Moment) &
  ((date: string, format: string | Array<string>) => Moment) &
  ((date: string, format: string | Array<string>, strict: boolean) => Moment) &
  ((date: string, format: string | Array<string>, locale: string) => Moment) &
  ((
    date: string,
    format: string | Array<string>,
    locale: string,
    strict: boolean,
  ) => Moment);

// a set of the momentjs methods we're exposing as this class' public API
const EXPOSED_METHODS = new Set([
  'format',
  'isAfter',
  'isSameOrAfter',
  'isBefore',
  'isSameOrBefore',
  'isValid',
  'add',
  'subtract',
  'diff',
  'startOf',
  'endOf',
  'max',
  'unix',
]);

// NOTE(stephen): Only supporting a subset of momentjs's static methods for now.
export default class Moment {
  _referenceMoment: moment$Moment;
  _internalMoment: moment$Moment;

  static create: MomentInitializerFns = (...args) => new Moment(...args);

  // Create a Moment from a Unix timestamp (seconds since the Unix Epoch)
  static unix(secondsSinceEpoch: number): Moment {
    return Moment.create(moment.unix(secondsSinceEpoch));
  }

  // Create a Moment in UTC mode. See: https://momentjs.com/docs/#/parsing/utc
  static utc: MomentInitializerFns = (...args) =>
    Moment.create(moment.utc(...args));

  // Expose the momentjs max() function
  static max(moments: $ReadOnlyArray<Moment>): Moment {
    return Moment.create(moment.max(moments.map(m => m._internalMoment)));
  }

  constructor(...args: any) {
    this._internalMoment = moment(...args);
    this._referenceMoment = this._internalMoment.clone();
  }

  momentView(): moment$Moment {
    return this._internalMoment;
  }

  // Expose the momentjs format() function
  format(format?: string): string {
    return this._internalMoment.format(format);
  }

  // Expose the isAfter function, but it only accepts our Moment instances
  isAfter(momentInstance: Moment, unitPrecision?: ?string): boolean {
    return this._internalMoment.isAfter(
      momentInstance._internalMoment,
      unitPrecision,
    );
  }

  // Expose the isSameOrAfter function, but it only accepts our Moment instances
  isSameOrAfter(momentInstance: Moment, unitPrecision?: ?string): boolean {
    return this._internalMoment.isSameOrAfter(
      momentInstance._internalMoment,
      unitPrecision,
    );
  }

  // Expose the isBefore function, but it only accepts our Moment instances
  isBefore(momentInstance: Moment, unitPrecision?: ?string): boolean {
    return this._internalMoment.isBefore(
      momentInstance._internalMoment,
      unitPrecision,
    );
  }

  // Expose the isSameOrBefore function, but it only accepts our Moment
  // instances
  isSameOrBefore(momentInstance: Moment, unitPrecision?: ?string): boolean {
    return this._internalMoment.isSameOrBefore(
      momentInstance._internalMoment,
      unitPrecision,
    );
  }

  // Expose the isSame function, but it only accepts our Moment instances
  isSame(momentInstance: Moment, unitPrecision?: ?string): boolean {
    return this._internalMoment.isSame(
      momentInstance._internalMoment,
      unitPrecision,
    );
  }

  isValid(): boolean {
    return this._internalMoment.isValid();
  }

  // Expose the isSame function, but it only accepts our Moment instances
  diff(momentInstance: Moment, unitPrecision?: string): number {
    return this._internalMoment.diff(
      momentInstance._internalMoment,
      unitPrecision,
    );
  }

  // Expose the add function, but stricter (each argument is required now)
  add(value: number, unit: string): Moment {
    return Moment.create(this._internalMoment.clone().add(value, unit));
  }

  // Expose the subtract function, but stricter (each argument is required now)
  subtract(value: number, unit: string): Moment {
    return Moment.create(this._internalMoment.clone().subtract(value, unit));
  }

  // Expose the startOf function
  startOf(unit: string): Moment {
    return Moment.create(this._internalMoment.clone().startOf(unit));
  }

  // Expose the endOf function
  endOf(unit: string): Moment {
    return Moment.create(this._internalMoment.clone().endOf(unit));
  }

  // Expose the unix function
  unix(): number {
    return this._internalMoment.unix();
  }

  // Provide an immutability layer on top of momentjs's API calls. Some momentjs
  // methods (like momentInstance.startOf('day')) will modify the underlying
  // momentjs object instead of returning a copy.
  _hook(method: string, ...args: Array<mixed>) {
    // $FlowSuppressError
    const output = this._internalMoment[method](...args);

    // Check to see if the call modified our internal moment
    if (this._internalMoment.valueOf() !== this._referenceMoment.valueOf()) {
      this._internalMoment = this._referenceMoment.clone();
    }

    // If the call was designed to generate a new moment, return a new instance
    // of our model wrapped around the result.
    if (output instanceof moment) {
      return Moment.create(((output: any): moment$Moment));
    }

    // Otherwise, return the result directly.
    return output;
  }
}

// Hook into moment's public API and wrap all calls to go through our
// immutability layer.
// TODO(pablo): eventually we should remove this and only keep the methods
// we explicitly defined in the class body. We are keeping this wrapper
// for now because older uses of this class might depend on it having all of
// momentjs exposed for use. Idk. Don't wanna break something.
Object.keys(moment.prototype).forEach(method => {
  if (!EXPOSED_METHODS.has(method)) {
    // $FlowSuppressError
    Moment.prototype[method] = function m(...args) {
      return Moment.prototype._hook.call(this, method, ...args);
    };
  }
});
