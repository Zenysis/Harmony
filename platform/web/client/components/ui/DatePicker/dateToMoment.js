// @flow
import moment from 'moment';

/**
 * Safely convert a Date object to a moment$Moment object, but if Date
 * is null or undefined then also return null or undefined.
 */
/* ::
declare function dateToMoment(date: null): null;
declare function dateToMoment(date: void): void;
declare function dateToMoment(date: Date): moment$Moment;
*/
export default function dateToMoment(date: ?Date): ?moment$Moment {
  return !date ? date : moment(date);
}
