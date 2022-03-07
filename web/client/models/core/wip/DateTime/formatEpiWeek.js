// @flow
// This file provides custom extensions to Momentjs for formatting dates using
// the WHO and CDC epi-week schemes.
// Reference: https://rdrr.io/github/chrismerkord/epical/man/epical.html
import moment from 'moment';

// A mapping from epi year number to the first date of the epi year.
type EpiYearCache = Map<number, moment$Moment>;

export const CDC_FORMAT_TOKEN = 'cc';
export const WHO_FORMAT_TOKEN = 'rr';
const EPI_YEAR_CACHE: {
  CDC: EpiYearCache,
  WHO: EpiYearCache,
} = {
  CDC: new Map(),
  WHO: new Map(),
};

function calculateEpiYearStart(
  year: number,
  whoDefinition: boolean,
): moment$Moment {
  // Cache the epi year start date so we don't need to perform the same
  // calculation multiple times.
  const cache = whoDefinition ? EPI_YEAR_CACHE.WHO : EPI_YEAR_CACHE.CDC;
  const cachedValue = cache.get(year);
  if (cachedValue !== undefined) {
    return cachedValue;
  }

  // The end of the first epidemiological week of the year by definition must
  // fall at least four days into the year. In other words, the first
  // epidemiological week always begins on a date between December 29 and
  // January 4.
  // To calculate the start of the epi year, we find the week that contains
  // January 4 and then find when that week starts.
  const date = moment.utc([year, 0, 4]);
  const dayOfWeek = date.day();

  // The WHO uses Monday as the start of the epi week, while the CDC uses
  // Sunday. Moment reports day of week between 0 - 6 with 0 being Sunday.
  let offset = dayOfWeek;
  if (whoDefinition) {
    offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  }
  const output = date.subtract(offset, 'day');
  cache.set(year, output);
  return output;
}

function findEpiYearStart(
  momentInstance: moment$Moment,
  whoDefinition: boolean,
): { date: moment$Moment, epiYear: number } {
  // Use the calendar year of this date to find the correct epi year.
  const calendarYear = momentInstance.year();
  const epiYearStart = calculateEpiYearStart(calendarYear, whoDefinition);

  // If this date falls between December 29 and December 31, it is possible for
  // it to be in a different epi year than its calendar year. When this happens,
  // test the next
  if (momentInstance.month() === 11 && momentInstance.date() >= 29) {
    const nextEpiYearStart = calculateEpiYearStart(
      calendarYear + 1,
      whoDefinition,
    );
    // If the number of days after the next start of the epi year is nonzero,
    // then this date should belong to the next epi year.
    if (momentInstance.diff(nextEpiYearStart, 'days') >= 0) {
      return {
        epiYear: calendarYear + 1,
        date: nextEpiYearStart,
      };
    }
  }
  return {
    date: epiYearStart,
    epiYear: calendarYear,
  };
}

function calculateEpiWeek(
  momentInstance: moment$Moment,
  whoDefinition: boolean,
): { epiWeek: number, epiYear: number } {
  const { date, epiYear } = findEpiYearStart(momentInstance, whoDefinition);
  const daysSinceStart = momentInstance.diff(date, 'days');

  return {
    // Calculate the number of weeks since the epi year start. The epi week
    // returned is 1 indexed.
    epiWeek: Math.floor(daysSinceStart / 7) + 1,
    // Return the year, in case it changed.
    epiYear,
  };
}

// Determine which Epi calendar type is used based on the provided format. If
// the format does not use either the CDC or WHO epi calendar, then return
// `undefined` to signal it could not be determined.
function detectEpiCalendarType(format: string): 'cdc' | 'who' | void {
  if (format.includes(WHO_FORMAT_TOKEN)) {
    return 'who';
  }

  if (format.includes(CDC_FORMAT_TOKEN)) {
    return 'cdc';
  }

  // The date format supplied is neither WHO or CDC.
  return undefined;
}

/** Calculate the epidemiological year for the given date. */
export function calculateEpiYear(
  momentInstance: moment$Moment,
  format?: string,
): number {
  const epiCalendarType = detectEpiCalendarType(format || '');
  if (epiCalendarType === undefined) {
    return momentInstance.year();
  }

  return calculateEpiWeek(momentInstance, epiCalendarType === 'who').epiYear;
}

/** Format the given date using an epidemiological date format. */
export default function formatEpiWeek(
  momentInstance: moment$Moment,
  format?: string,
): string {
  if (!format) {
    return momentInstance.format(format);
  }

  const epiCalendarType = detectEpiCalendarType(format || '');
  if (epiCalendarType === undefined) {
    return momentInstance.format(format);
  }

  const usesWHOFormat = epiCalendarType === 'who';
  const { epiWeek, epiYear } = calculateEpiWeek(momentInstance, usesWHOFormat);
  const token = usesWHOFormat ? WHO_FORMAT_TOKEN : CDC_FORMAT_TOKEN;

  // Replace the epi week format token with the true epi week value. Update the
  // format string to include the epi week value in a way that moment will not
  // parse it and will safely return it verbatim.
  return momentInstance
    .clone()
    .year(epiYear)
    .format(format.replace(token, `[${epiWeek}]`));
}
