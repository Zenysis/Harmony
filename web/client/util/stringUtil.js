// @flow

export const CASE_COMPARISON = {
  CASE_SENSITIVE: 0,
  IGNORE_CASE: 1,
};

const HTML_ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape all special HTML characters so they can be rendered in
 * HTML input and avoid injections.
 */
export function escapeHTML(str: string): string {
  return String(str).replace(/[&<>"'`=/]/g, s => HTML_ENTITY_MAP[s]);
}

/**
 * Escape all special regexp characters in a string with a \ so
 * it can be used in RegExp. (e.g. used in replaceAll)
 */
function escapeRegExp(str: string): string {
  // eslint-disable-next-line no-useless-escape
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

/**
 * Replace all instances of searchText with replacement
 * Params:
 *   str: base string
 *   searchText: string to search for
 *   replacement: string to replace every instance of searchText with
 * Return: new string
 */
export function replaceAll(
  str: string,
  searchText: string,
  replacement: string,
): string {
  return str.replace(new RegExp(escapeRegExp(searchText), 'g'), replacement);
}

/**
 * Replace the characters in str from startIndex to endIndex with replacement.
 * if startIndex === endIndex then this behaves as just inserting replacement
 * at startIndex, without actually replacing any characters.,
 * Params:
 *   str: base string
 *   replacement: string to insert
 *   startIndex: index at which we will start replacing
 *   endIndex: index at which we will stop replacing
 * Return: new string
 */
export function replaceAt(
  str: string,
  replacement: string,
  startIndex: number,
  endIndex: number,
): string {
  return `${str.slice(0, startIndex)}${replacement}${str.slice(endIndex)}`;
}

/**
 * Find all the indices at which searchText is present in the given string.
 * Params:
 *   str: base string
 *   searchText: string to search for
 * Return: array of starting indices for each instance of searchText
 * Example:
 *   findAllIndices('foo foo bar bar foo', 'foo') => [0, 4, 16]
 */
export function findAllIndices(str: string, searchText: string): Array<number> {
  if (str.length === 0) {
    return [];
  }

  if (searchText.length === 0) {
    throw new Error('[util] The text to search cannot be empty.');
  }

  const result = [];
  let index = str.indexOf(searchText, 0);
  while (index > -1) {
    result.push(index);
    index += searchText.length;
    index = str.indexOf(searchText, index);
  }
  return result;
}

/**
 * Capitalize the first letter of a string.
 * If lowerCaseTheRest is set, then the rest of the string is lower cased.
 * Otherwise, the rest of the string is left as is.
 *
 * Params:
 *   s: string
 * Return: capitalized string
 */
/* ::
declare function capitalize(s: void, lowerCaseTheRest?: boolean): void;
declare function capitalize(s: null, lowerCaseTheRest?: boolean): null;
declare function capitalize(s: string, lowerCaseTheRest?: boolean): string;
*/
export function capitalize(
  s: ?string,
  lowerCaseTheRest?: boolean = true,
): ?string {
  if (!s || s.length < 1) {
    return s;
  }
  const firstChar = s.slice(0, 1).toUpperCase();
  const rest = lowerCaseTheRest ? s.slice(1).toLowerCase() : s.slice(1);
  return firstChar + rest;
}

/**
 * Capitalize each word
 * Params:
 *   s: string
 * Return: string with each word capitalized
 */
/* ::
 declare function capitalizeEachWord(s: string): string;
 declare function capitalizeEachWord(s: void): void;
 declare function capitalizeEachWord(s: null): null;
 */
export function capitalizeEachWord(s: ?string): ?string {
  if (!s || s.length < 1) {
    return s;
  }
  return s.replace(/\w\S*/g, (x: string) => capitalize(x, false));
}

/**
 * Splits a camel-cased string into a string with spaces,
 * and optionally upper-cases the first character.
 * Example:
 *   'thisStringIsGood' -> 'This String Is Good'
 * This function is not very smart and works by just inserting a space after
 * every upper-case letter. So it will not detect more complex patterns like:
 *   'HTMLString' -> ' H T M L String'
 * Params:
 *   s: string
 * Return: string split into spaces
 */
export function splitCamelCase(
  s: string,
  firstCharUpper?: boolean = true,
): string {
  const newStr = s.replace(/([A-Z])/g, ' $1');
  return firstCharUpper
    ? newStr.replace(/^./, str => str.toUpperCase())
    : newStr;
}

/**
 * Truncate a string to a given limit and adds `…` to the end
 * Params:
 *   str: base string
 *   limit: amount of characters at which to truncate
 * Return: truncated string
 */
export function truncate(str: string, limit?: number = 50): string {
  if (str.length <= limit) {
    return str;
  }
  return `${str.slice(0, limit)}…`;
}

/**
 * Compare function for two strings in an array.sort
 */
export function sortString(a: string, b: string): number {
  if (String.prototype.localeCompare) {
    return a.localeCompare(b);
  }

  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

// TODO(vedant, pablo): When locale comparison becomes necessary,
// implement it
function areStringsEqual(
  thisString: string,
  thatString: string,
  caseComparison: number,
): boolean {
  const ignoreCase = caseComparison === CASE_COMPARISON.IGNORE_CASE;

  if (ignoreCase) {
    return thisString.toUpperCase() === thatString.toUpperCase();
  }

  return thisString === thatString;
}

/**
 * Check if two strings are equal (ignoring case)
 * Return: boolean
 */
export function areStringsEqualIgnoreCase(
  thisString: string,
  thatString: string,
): boolean {
  return areStringsEqual(thisString, thatString, CASE_COMPARISON.IGNORE_CASE);
}

/**
 * Function used to normalize string inputs for floats.
 * More on the issue: https://github.com/erikras/redux-form/issues/1383
 * Arguments:
 *   value: string
 * Return:
 *   normalized string
 *   Examples:
 *     normalizeFloatInput('12d') -> '12'
 *     normalizeFloatInput('12.') -> '12.'
 *     normalizeFloatInput('$123.4') -> '123.4'
 *     normalizeFloatInput('123.456') -> '123.456'
 *     normalizeFloatInput('1,223.45') -> '1223.45'
 */
export function normalizeFloatInput(value: ?string): string {
  if (value === null || value === '' || value === undefined) {
    return '';
  }
  let v = value.toString().replace(/[^-\d.]/g, '');
  // NOTE(abby): keep a negative symbol in the first position, else remove them
  v = v.slice(0, 1) + v.slice(1).replace(/-/g, '');
  // NOTE(abby): keep only one period
  let i = 0;
  v = v.replace(/\./g, m => (!i++ ? m : ''));
  return v;
}

/**
 * Function used to parse a string to a number or return undefined if it
 * cannot be parsed
 */
export function convertToNumberOrUndefined(value: string): number | void {
  const floatVal = parseFloat(normalizeFloatInput(value));
  return Number.isNaN(floatVal) ? undefined : floatVal;
}

/**
 * Search for a given string in a block of text (or an array of strings).
 * This works more intelligently than a `.includes()` operation because instead
 * of looking for exact matches, we are looking for keyword matches.
 *
 * Our search string gets split into search terms, and the `fullText` gets split
 * into an array of keywords. We return true if every search term was included
 * in any of the keywords. This allows for the following match:
 *   'hea servi' matches with 'Health Services'
 *   'my dash' matches with 'My Favorite Dashboard'
 *
 * @param {string | Array<string>} txtToSearch string to split into search terms
 * @param {string | Array<string>} fullText text to split into search keywords
 * @param {number} caseComparison enum to be case insensitive or not
 * @returns {boolean} true if every search term is included in any of the
 *   keywords, false otherwise
 */
export function keywordSearch(
  txtToSearch: string | Array<string>,
  fullText: string | Array<string>,
  caseComparison?: number = CASE_COMPARISON.IGNORE_CASE,
): boolean {
  let searchableParts = [];
  let searchTerms = [];
  if (caseComparison === CASE_COMPARISON.IGNORE_CASE) {
    // make everything lower case
    searchableParts = Array.isArray(fullText)
      ? fullText.map(str => str.toLowerCase())
      : fullText.toLowerCase().split(' ');
    searchTerms = Array.isArray(txtToSearch)
      ? txtToSearch.map(str => str.toLowerCase())
      : txtToSearch.toLowerCase().split(' ');
  } else if (caseComparison === CASE_COMPARISON.CASE_SENSITIVE) {
    // use the strings as they are passed
    searchableParts = Array.isArray(fullText) ? fullText : fullText.split(' ');
    searchTerms = Array.isArray(txtToSearch)
      ? txtToSearch
      : txtToSearch.split(' ');
  }

  // Every search term must be found in at least one of the searchable keywords
  return searchTerms.every(searchTerm =>
    searchableParts.some(keyword => keyword.includes(searchTerm)),
  );
}

/**
 * Generate a random string of a given string length (defaults to 10)
 * https://stackoverflow.com/questions/1349404/
 *   generate-random-string-characters-in-javascript
 */
export function generateRandomString(strLength?: number = 10): string {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < strLength; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Converts a pixel value of the format '12px' into a number
export function getPixelValue(fontSize: string): number {
  const pxLen = fontSize.length;
  return Number(fontSize.substr(0, pxLen - 2)); // remove trailing "px"
}

// Slugify a string
export function slugify(
  name: string,
  slugSeparator: string = '-',
  shortenStr: boolean = true,
): string {
  const INVALID_CHAR_REGEX = new RegExp('[^a-zA-Z0-9\\x80-\\uFFFF\\s]', 'g');
  const MULTI_SPACE_REGEX = new RegExp('[\\s]+', 'g');
  const MAX_LENGTH = 60;
  // HACK(sophie): for data upload, we don't want to cut off the string length
  // when we slugify
  const strLength = shortenStr ? MAX_LENGTH : name.length;
  const cleanName = name
    .trim()
    .replace(INVALID_CHAR_REGEX, ' ')
    .replace(MULTI_SPACE_REGEX, ' ')
    .toLocaleLowerCase()
    .substr(0, strLength)
    .trim();

  return cleanName.replace(MULTI_SPACE_REGEX, slugSeparator);
}
