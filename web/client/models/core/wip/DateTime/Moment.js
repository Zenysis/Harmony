// @flow
import moment from 'moment';

import formatCustom, {
  requiresCustomFormat,
} from 'models/core/wip/DateTime/formatCustom';

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
  | $ReadOnlyArray<number>
  | void
  | null;

type MomentImmutableInitializerFns = (() => Moment) &
  (MomentDateInitializer => Moment) &
  ((date: string, format: string | $ReadOnlyArray<string>) => Moment) &
  ((
    date: string,
    format: string | $ReadOnlyArray<string>,
    strict: boolean,
  ) => Moment) &
  ((
    date: string,
    format: string | $ReadOnlyArray<string>,
    locale: string,
  ) => Moment) &
  ((
    date: string,
    format: string | $ReadOnlyArray<string>,
    locale: string,
    strict: boolean,
  ) => Moment);

// The momentjs methods we directly implement in this class instead of patching.
const EXPOSED_METHODS = new Set([
  'format',
  'isAfter',
  'isSame',
  'isSameOrAfter',
  'isBefore',
  'isSameOrBefore',
  'isValid',
  'add',
  'subtract',
  'diff',
  'startOf',
  'endOf',
  'min',
  'max',
  'unix',
  'millisecond',
  'utc',
  'valueOf',
]);

// Momentjs's type definitions use `Array<string>` heavily in the constructor
// argument signature. We want the inputs to be pure, and although we're pretty
// sure momentjs does not mutate them, we can't be fully sure. This method will
// clone any array arguments into a new array to ensure any mutation happens on
// the copied array only.
// NOTE(stephen): Using `any` here since this is *very difficult* to flow type.
// As long as the parent function is properly typed, we will be ok.
function _cloneArgs(...args: any): any {
  /* eslint-disable no-param-reassign */
  if (Array.isArray(args[0])) {
    args[0] = [...args[0]];
  }
  if (Array.isArray(args[1])) {
    args[1] = [...args[1]];
  }
  return args;
}

// NOTE(stephen): Only supporting a subset of momentjs's static methods for now.
export default class Moment {
  _referenceMoment: moment$Moment;
  _internalMoment: moment$Moment;

  static create: MomentImmutableInitializerFns = (...args) =>
    new Moment(..._cloneArgs(...args));

  // Create a Moment from a Unix timestamp (seconds since the Unix Epoch)
  static unix(secondsSinceEpoch: number): Moment {
    return Moment.create(moment.unix(secondsSinceEpoch));
  }

  // Create a Moment in UTC mode. See: https://momentjs.com/docs/#/parsing/utc
  static utc: MomentImmutableInitializerFns = (...args) =>
    new Moment(moment.utc(..._cloneArgs(...args)));

  // Expose the momentjs min() function
  static min(moments: $ReadOnlyArray<Moment>): Moment {
    return Moment.create(moment.min(moments.map(m => m._internalMoment)));
  }

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
    // HACK(stephen): Augment momentjs to add support for formatting values with
    // custom format strings like epi week and half year.
    if (requiresCustomFormat(format)) {
      return formatCustom(this._internalMoment, format);
    }
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

  // Expose the millisecond function
  millisecond(): number {
    return this._internalMoment.millisecond();
  }

  // Expose the unix function - returns number of seconds since Unix epoch
  unix(): number {
    return this._internalMoment.unix();
  }

  // Expose the utc function - returns the current Moment in UTC
  utc(): Moment {
    return Moment.create(this._internalMoment.utc());
  }

  // Expose the valueOf function: return number of milliseconds since Unix epoch
  valueOf(): number {
    return this._internalMoment.valueOf();
  }

  // eslint-disable-next-line spaced-comment
  /*::
  // NOTE(stephen): Expose all additional Momentjs functions to Flow with our
  // immutable Moment class substituted in.
  // TODO(stephen): Remove deprecated methods, deprecated function signatures.
  // It is difficult to tell from the moment libdef what is allowed vs
  // deprecated.
  +calendar: (refTime?: any, formats?: moment$CalendarFormats) => string;
  +clone: () => Moment;
  +creationData: () => moment$MomentCreationData;
  +date: (() => number) & ((number: number) => Moment);
  +dates: (() => number) & ((number: number) => Moment);
  +day: (() => number) & ((day: number | string) => Moment);
  +dayOfYear: (() => number) & ((day: number) => Moment);
  +days: (() => number) & ((day: number | string) => Moment);
  +daysInMonth: () => number;
  +from: (value: Moment | string | number | Date | Array<number>,removePrefix?: boolean) => string;
  +fromNow: (removeSuffix?: boolean) => string;
  +get: (string: string) => number;
  +hour: (() => number) & ((number: number) => Moment);
  +hours: (() => number) & ((number: number) => Moment);
  +invalidAt: () => 0 | 1 | 2 | 3 | 4 | 5 | 6;
  +isBetween: (from: Moment | string | number | Date | Array<number>,to: Moment | string | number | Date | Array<number>,units?: string,inclusivity?: moment$Inclusivity) => boolean;
  +isDST: () => boolean;
  +isDSTShifted: () => boolean;
  +isLeapYear: () => boolean;
  +isoWeek: (() => number) & ((number: number) => Moment);
  +isoWeekYear: (() => number) & ((number: number) => Moment);
  +isoWeekday: (() => number) & ((day: number | string) => Moment);
  +isoWeeks: (() => number) & ((number: number) => Moment);
  +isoWeeksInYear: () => number;
  +local: () => Moment;
  +locale: (() => string) & ((locale: string, customization?: { ... } | null) => Moment);
  +localeData: () => moment$LocaleData;
  +milliseconds: (() => number) & ((number: number) => Moment);
  +minute: (() => number) & ((number: number) => Moment);
  +minutes: (() => number) & ((number: number) => Moment);
  +month: (() => number) & ((number: number) => Moment);
  +months: (() => number) & ((number: number) => Moment);
  +quarter: (() => number) & ((number: number) => Moment);
  +second: (() => number) & ((number: number) => Moment);
  +seconds: (() => number) & ((number: number) => Moment);
  +set: ((options: { [unit: string]: number, ... }) => Moment) & ((unit: string, value: number) => Moment);
  +to: (value: Moment | string | number | Date | Array<number>,removePrefix?: boolean) => string;
  +toArray: () => Array<number>;
  +toDate: () => Date;
  +toISOString: (keepOffset?: boolean) => string;
  +toJSON: () => string;
  +toNow: (removePrefix?: boolean) => string;
  +toObject: () => moment$MomentObject;
  +utcOffset: (() => number) & ((offset: number | string,keepLocalTime?: boolean,keepMinutes?: boolean) => Moment);
  +week: (() => number) & ((number: number) => Moment);
  +weekYear: (() => number) & ((number: number) => Moment);
  +weekday: (() => number) & ((number: number) => Moment);
  +weeks: (() => number) & ((number: number) => Moment);
  +weeksInYear: () => number;
  +year: (() => number) & ((number: number) => Moment);
  +years: (() => number) & ((number: number) => Moment);
  */

  // Provide an immutability layer on top of momentjs's API calls. Some momentjs
  // methods (like momentInstance.startOf('day')) will modify the underlying
  // momentjs object instead of returning a copy.
  _hook(method: string, ...args: Array<mixed>): mixed {
    // $FlowExpectedError[incompatible-use]
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
    // $FlowExpectedError[prop-missing]
    Moment.prototype[method] = function m(...args) {
      return Moment.prototype._hook.call(this, method, ...args);
    };
  }
});
