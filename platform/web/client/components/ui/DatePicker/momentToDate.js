// @flow

/**
 * Safely convert a moment$Moment object to a JS Date object, but ensuring
 * that the day does not change due to timezones.
 */
/* ::
declare function momentToDate(moment: null): null;
declare function momentToDate(moment: void): void;
declare function momentToDate(moment: moment$Moment): Date;
*/
export default function momentToDate(moment: ?moment$Moment): ?Date {
  if (!moment) {
    return moment;
  }

  return new Date(...moment.toArray().slice(0, 3));
}
