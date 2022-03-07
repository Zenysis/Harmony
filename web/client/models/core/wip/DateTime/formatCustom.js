// @flow
// Add support for custom format options to momentjs that are otherwise not
// possible. Examples include epi week formatting and half year format.
import formatEpiWeek, {
  CDC_FORMAT_TOKEN,
  WHO_FORMAT_TOKEN,
} from 'models/core/wip/DateTime/formatEpiWeek';

const HALF_YEAR_FORMAT_TOKEN = 'vv';

/**
 * Add support for inlcuding the half year numeral (1 for Jan - Jun, 2 for
 * Jul - Dec) in the formatted date.
 */
function formatHalfYear(momentInstance: moment$Moment, format: string): string {
  // Replace the half year format token with the true half year value. Update
  // the format string to include the half year value in a way that moment will
  // not parse it and will safely return it verbatim.
  const halfYear = momentInstance.quarter() <= 2 ? 1 : 2;
  return momentInstance.format(
    format.replace(HALF_YEAR_FORMAT_TOKEN, `[${halfYear}]`),
  );
}

/**
 * Find the formatting that can correctly fill out the custom date format in the
 * user's format string. If no custom date format is being used, return
 * `undefined`.
 */
function getCustomFormatter(
  format: string,
): ((moment$Moment, string) => string) | void {
  if (format.includes(CDC_FORMAT_TOKEN) || format.includes(WHO_FORMAT_TOKEN)) {
    return formatEpiWeek;
  }

  if (format.includes(HALF_YEAR_FORMAT_TOKEN)) {
    return formatHalfYear;
  }

  return undefined;
}

/** Determine if the format string provided requires special handling. */
export function requiresCustomFormat(format?: string): boolean {
  if (!format) {
    return false;
  }

  return getCustomFormatter(format) !== undefined;
}

/**
 * Produce a formatted date string based on the custom format (if provided).
 *
 * NOTE(stephen): Right now, we only support having a single custom format at a
 * time.
 */
export default function formatCustom(
  momentInstance: moment$Moment,
  format?: string,
): string {
  if (!format) {
    return momentInstance.format(format);
  }

  const formatter = getCustomFormatter(format);
  if (formatter === undefined) {
    return momentInstance.format(format);
  }

  return formatter(momentInstance, format);
}
