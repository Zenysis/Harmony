// @flow
import {
  CASE_COMPARISON,
  escapeHTML,
  replaceAll,
  replaceAt,
  findAllIndices,
  capitalize,
  capitalizeEachWord,
  splitCamelCase,
  truncate,
  sortString,
  areStringsEqualIgnoreCase,
  normalizeFloatInput,
  convertToNumberOrUndefined,
  keywordSearch,
  generateRandomString,
  getPixelValue,
} from 'util/stringUtil';

describe('stringUtil', () => {
  test('`escapeHTML` returns a new string', () => {
    const str = '"a string"';
    expect(escapeHTML(str)).not.toBe(str);
  });

  test('`escapeHTML` leaves empty strings unchanged', () => {
    expect(escapeHTML('')).toBe('');
  });

  // check the numerical character codes are correct
  function decodeHTML(str: string) {
    const escapedStr = escapeHTML(str);
    return String.fromCharCode(
      // eslint-disable-next-line radix
      parseInt(`0${escapedStr.substring(2, escapedStr.length - 1)}`),
    );
  }

  test('`escapeHTML` handles `&` correctly', () => {
    expect(escapeHTML('&')).toBe('&amp;');
  });

  test('`escapeHTML` handles `<` correctly', () => {
    expect(escapeHTML('<')).toBe('&lt;');
  });

  test('`escapeHTML` handles `>` correctly', () => {
    expect(escapeHTML('>')).toBe('&gt;');
  });

  test('`escapeHTML` handles `"` correctly', () => {
    expect(escapeHTML('"')).toBe('&quot;');
  });

  test("`escapeHTML` handles `'` correctly", () => {
    expect(escapeHTML("'")).toBe('&#39;');
    expect(decodeHTML("'")).toBe("'");
  });

  test('`escapeHTML` handles `/` correctly', () => {
    expect(escapeHTML('/')).toBe('&#x2F;');
    expect(decodeHTML('/')).toBe('/');
  });

  test("`escapeHTML` handles '`' correctly", () => {
    expect(escapeHTML('`')).toBe('&#x60;');
    expect(decodeHTML('`')).toBe('`');
  });

  test('`escapeHTML` handles `=` correctly', () => {
    expect(escapeHTML('=')).toBe('&#x3D;');
    expect(decodeHTML('=')).toBe('=');
  });

  test('`escapeHTML` handles multiple escapes correctly', () => {
    expect(escapeHTML('&><`')).toBe('&amp;&gt;&lt;&#x60;');
  });

  test('`escapeHTML` handles mixed characters correctly', () => {
    expect(escapeHTML('"a string" that did not have = & /!')).toBe(
      '&quot;a string&quot; that did not have &#x3D; &amp; &#x2F;!',
    );
  });

  test('`replaceAll` returns a new string', () => {
    const str = '"a string"';
    expect(replaceAll(str, 'a', 'b')).not.toBe(str);
  });

  test('`replaceAll` leaves empty strings unchanged', () => {
    expect(replaceAll('', 'a', 'b')).toBe('');
    expect(replaceAll('', 'a', '')).toBe('');
  });

  test('`replaceAll` replaces with an empty string correctly', () => {
    expect(replaceAll('a', 'a', '')).toBe('');
    expect(replaceAll('b', 'a', '')).toBe('b');
  });

  test('`replaceAll` leaves string unchanged with no matches', () => {
    expect(replaceAll('abc', 'd', 'e')).toBe('abc');
    expect(replaceAll('ab cd ef', 'bc', '--')).toBe('ab cd ef');
  });

  test('`replaceAll` handles multiple matches correctly', () => {
    expect(replaceAll('aabbaaccaaddaa', 'aa', '--')).toBe('--bb--cc--dd--');
    expect(replaceAll('the them their then', 'the', '*')).toBe('* *m *ir *n');
  });

  test('`replaceAll` escapes regex characters correctly', () => {
    expect(replaceAll('\\..', '\\', 'a')).toBe('a..');
    expect(replaceAll('.]\\.+?*.(', '.', '^')).toBe('^]\\^+?*^(');
  });

  test('`replaceAll` replaces same text correctly', () => {
    expect(replaceAll('aaaa', 'a', 'a')).toBe('aaaa');
  });

  test('`replaceAt` returns a new string', () => {
    const str = 'a string';
    expect(replaceAt(str, 'a', 0, 8)).not.toBe(str);
  });

  test('`replaceAt` handles empty strings correctly', () => {
    expect(replaceAt('', '', 0, 0)).toBe('');
    expect(replaceAt('', 'a', 0, 0)).toBe('a');
    expect(replaceAt('a', '', 0, 1)).toBe('');
  });

  test('`replaceAt` handles different locations correctly', () => {
    expect(replaceAt('1234567890', '-', 0, 1)).toBe('-234567890');
    expect(replaceAt('1234567890', '-', 5, 7)).toBe('12345-890');
    expect(replaceAt('1234567890', '-', 9, 10)).toBe('123456789-');
  });

  test('`replaceAt` handles different lengths correctly', () => {
    expect(replaceAt('1234567890', '-', 0, 10)).toBe('-');
    expect(replaceAt('1234567890', '-', 0, 5)).toBe('-67890');
    expect(replaceAt('1234567890', '-', 0, 100)).toBe('-');
  });

  test('`replaceAt` handles insertion correctly', () => {
    expect(replaceAt('1234567890', '-', 0, 0)).toBe('-1234567890');
    expect(replaceAt('1234567890', '-', 5, 5)).toBe('12345-67890');
    expect(replaceAt('1234567890', '-', 10, 10)).toBe('1234567890-');
    expect(replaceAt('1234567890', '-', 100, 100)).toBe('1234567890-');
  });

  test('`replaceAt` handles negative numbers correctly', () => {
    expect(replaceAt('1234567890', '-', -3, 9)).toBe('1234567-0');
    expect(replaceAt('1234567890', '-', -3, -1)).toBe('1234567-0');
    expect(replaceAt('1234567890', '-', 7, -1)).toBe('1234567-0');
    expect(replaceAt('1234567890', '-', -3, -3)).toBe('1234567-890');
  });

  test('`findAllIndices` finds no instances in an empty string', () => {
    expect(findAllIndices('', '')).toEqual([]);
    expect(findAllIndices('', 'a')).toEqual([]);
  });

  test('`findAllIndices` throws an error searching for an empty string', () => {
    expect(() => findAllIndices('a', '')).toThrowError();
  });

  test('`findAllIndices` returns an empty array when nothing is found', () => {
    expect(findAllIndices('hello this is a sentence', 'dfd')).toEqual([]);
  });

  test("`findAllIndices` doesn't match differently cased strings", () => {
    expect(findAllIndices('hello this is a sentence', 'HELLO')).toEqual([]);
  });

  test('`findAllIndices` finds multi-character words', () => {
    expect(findAllIndices('hello this is a sentence', 'this')).toEqual([6]);
  });

  test('`findAllIndices` returns correct index for first and last characters', () => {
    expect(findAllIndices('hello this is a sentence', 'this')).toEqual([6]);
    expect(findAllIndices('1234567890', '1')).toEqual([0]);
    expect(findAllIndices('1234567890', '0')).toEqual([9]);
  });

  test('`findAllIndices` returns multiple indices for multiple matches', () => {
    expect(findAllIndices('hello this is a sentence', 'e')).toEqual([
      1,
      17,
      20,
      23,
    ]);
    expect(findAllIndices('ababab', 'a')).toEqual([0, 2, 4]);
    expect(findAllIndices('foo foo bar bar foo', 'foo')).toEqual([0, 4, 16]);
  });

  test('`findAllIndices` handles funky characters correctly', () => {
    expect(findAllIndices('hj.2312,/.[56+', '.')).toEqual([2, 9]);
    expect(findAllIndices('hj.2312,/.[56+', '[')).toEqual([10]);
    expect(findAllIndices('hj.2312,/.[56+', '2')).toEqual([3, 6]);
  });

  test('`capitalize` returns a new string', () => {
    const str = 'a string';
    expect(capitalize(str)).not.toBe(str);
  });

  test('`capitalize` leaves empty strings unchanged', () => {
    expect(capitalize('')).toBe('');
  });

  test('`capitalize` returns undefined or null for undefined or null inputs', () => {
    expect(capitalize()).toBeUndefined();
    expect(capitalize(undefined)).toBeUndefined();
    expect(capitalize(null)).toBeNull();
  });

  test('`capitalize` without capitalize the rest capitalizes only the first letter', () => {
    expect(capitalize('a', false)).toBe('A');
    expect(capitalize('abc', false)).toBe('Abc');
    expect(capitalize('Abc', false)).toBe('Abc');
    expect(capitalize('ABC', false)).toBe('ABC');
  });

  test('`capitalize` lower cases other letters correctly', () => {
    expect(capitalize('a')).toBe('A');
    expect(capitalize('abc')).toBe('Abc');
    expect(capitalize('Abc')).toBe('Abc');
    expect(capitalize('ABC')).toBe('Abc');
  });

  test('`capitalizeEachWord` returns a new string', () => {
    const str = 'a string';
    expect(capitalizeEachWord(str)).not.toBe(str);
  });

  test('`capitalizeEachWord` leaves empty strings unchanged', () => {
    expect(capitalizeEachWord('')).toBe('');
  });

  test('`capitalizeEachWord` returns undefined or null for undefined or null inputs', () => {
    expect(capitalizeEachWord()).toBeUndefined();
    expect(capitalizeEachWord(undefined)).toBeUndefined();
    expect(capitalizeEachWord(null)).toBeNull();
  });

  test('`capitalizeEachWord` capitalizes only the first letter of each word', () => {
    expect(capitalizeEachWord('a b c')).toBe('A B C');
    expect(capitalizeEachWord('aa bb cc')).toBe('Aa Bb Cc');
    expect(capitalizeEachWord('A B C')).toBe('A B C');
    expect(capitalizeEachWord('Aa Bb Cc')).toBe('Aa Bb Cc');
    expect(capitalizeEachWord('AA BB CC')).toBe('AA BB CC');
  });

  test('`capitalizeEachWord` works with a variety of whitespace', () => {
    expect(capitalizeEachWord('a b c ')).toBe('A B C ');
    expect(capitalizeEachWord('aa\tbb')).toBe('Aa\tBb');
    expect(capitalizeEachWord('a\nb')).toBe('A\nB');
  });

  test('`splitCamelCase` returns a new string', () => {
    const str = 'aString';
    expect(splitCamelCase(str)).not.toBe(str);
  });

  test('`splitCamelCase` leaves empty strings unchanged', () => {
    expect(splitCamelCase('', true)).toBe('');
    expect(splitCamelCase('', false)).toBe('');
  });

  test('`splitCamelCase` splits correctly', () => {
    expect(splitCamelCase('thisStringIsGood', false)).toBe(
      'this String Is Good',
    );
    expect(splitCamelCase('HTMLString', false)).toBe(' H T M L String');
  });

  test('`splitCamelCase` capitalizes correctly', () => {
    expect(splitCamelCase('thisStringIsGood')).toBe('This String Is Good');
    expect(splitCamelCase('HTMLString')).toBe(' H T M L String');
  });

  test('`truncate` returns a new string', () => {
    const str = 'a string';
    expect(truncate(str, 2)).not.toBe(str);
  });

  test('`truncate` leaves empty strings unchanged', () => {
    expect(truncate('')).toBe('');
    expect(truncate('', 0)).toBe('');
  });

  test('`truncate` returns the correct length', () => {
    expect(truncate('12345').length).toBe(5);
    expect(truncate('1234567890', 0).length).toBe(1);
    expect(truncate('1234567890', 1).length).toBe(2);
    expect(truncate('1234567890', 5).length).toBe(6);
    expect(truncate('1234567890', 10).length).toBe(10);
    expect(truncate('1234567890', 100).length).toBe(10);
  });

  test('`truncate` truncates correctly', () => {
    expect(truncate('1234567890')).toBe('1234567890');
    expect(truncate('1234567890', 0)).toBe('…');
    expect(truncate('1234567890', 1)).toBe('1…');
    expect(truncate('1234567890', 5)).toBe('12345…');
    expect(truncate('1234567890', 10)).toBe('1234567890');
    expect(truncate('1234567890', 100)).toBe('1234567890');
  });

  test('`truncate` treats negative numbers like 0', () => {
    expect(truncate('1234567890', -10)).toBe('…');
  });

  test('`sortString` returns 0 for equal strings', () => {
    expect(sortString('', '')).toBe(0);
    expect(sortString('abba', 'abba')).toBe(0);
    expect(sortString('fasd7868adf./,saf', 'fasd7868adf./,saf')).toBe(0);
    expect(sortString('1234', '1234')).toBe(0);
    expect(sortString('jhbbhVGHVG', 'jhbbhVGHVG')).toBe(0);
  });

  test('`sortString` returns a negative number for sorted strings', () => {
    expect(sortString('a', 'b') < 0).toBe(true);
    expect(sortString('azzzzzzzz', 'baaaaaa') < 0).toBe(true);
    expect(sortString('1', '7') < 0).toBe(true);
    expect(sortString('a', 'A') < 0).toBe(true);
    expect(sortString('aaa', 'aab') < 0).toBe(true);
  });

  test('`sortString` returns a negative number for shorter (but otherwise equal) strings', () => {
    expect(sortString('aaa', 'aaaa') < 0).toBe(true);
    expect(sortString('', 'sdf') < 0).toBe(true);
  });

  test('`sortString` returns a positive number for reverse sorted strings', () => {
    expect(sortString('b', 'a') > 0).toBe(true);
    expect(sortString('baaaaaa', 'azzzzzzzz') > 0).toBe(true);
    expect(sortString('7', '1') > 0).toBe(true);
    expect(sortString('A', 'a') > 0).toBe(true);
    expect(sortString('aab', 'aaa') > 0).toBe(true);
  });

  test('`sortString` returns a positive number for longer (but otherwise equal) strings', () => {
    expect(sortString('aaaa', 'aaa') > 0).toBe(true);
    expect(sortString('sdf', '') > 0).toBe(true);
  });

  test('`areStringsEqualIgnoreCase` returns true for empty strings', () => {
    expect(areStringsEqualIgnoreCase('', '')).toBe(true);
  });

  test('`areStringsEqualIgnoreCase` returns false for different strings', () => {
    expect(areStringsEqualIgnoreCase('a', '')).toBe(false);
    expect(areStringsEqualIgnoreCase('', 'b')).toBe(false);
    expect(areStringsEqualIgnoreCase('abba', 'baab')).toBe(false);
    expect(areStringsEqualIgnoreCase('ABab', 'BABA')).toBe(false);
  });

  test('`areStringsEqualIgnoreCase` returns true for the same string', () => {
    expect(areStringsEqualIgnoreCase('abba', 'abba')).toBe(true);
  });

  test('`areStringsEqualIgnoreCase` returns true for case insensitive same string', () => {
    expect(areStringsEqualIgnoreCase('abba', 'ABBA')).toBe(true);
    expect(areStringsEqualIgnoreCase('aBbA', 'AbBa')).toBe(true);
  });

  test('`normalizeFloatInput` returns a new string', () => {
    const str = 'a string';
    expect(normalizeFloatInput(str)).not.toBe(str);
  });

  test('`normalizeFloatInput` returns empty strings for empty, null, or undefined inputs', () => {
    expect(normalizeFloatInput('')).toBe('');
    expect(normalizeFloatInput()).toBe('');
    expect(normalizeFloatInput(null)).toBe('');
    expect(normalizeFloatInput(undefined)).toBe('');
  });

  test('`normalizeFloatInput` works for negative numbers', () => {
    expect(normalizeFloatInput('-90')).toBe('-90');
    expect(normalizeFloatInput('-90,000.98')).toBe('-90000.98');
  });

  test('`normalizeFloatInput` strips text out correctly', () => {
    expect(normalizeFloatInput('words')).toBe('');
    expect(normalizeFloatInput('12d')).toBe('12');
    expect(normalizeFloatInput('12.')).toBe('12.');
    expect(normalizeFloatInput('$123.4')).toBe('123.4');
    expect(normalizeFloatInput('123.456')).toBe('123.456');
    expect(normalizeFloatInput('1,223.45')).toBe('1223.45');
    expect(normalizeFloatInput('0.09.98')).toBe('0.0998');
    expect(normalizeFloatInput('word 788787')).toBe('788787');
    expect(normalizeFloatInput('word 7z7.9x9 word')).toBe('77.99');
    expect(normalizeFloatInput('$788,787.99')).toBe('788787.99');
  });

  test('`convertToNumberOrUndefined` returns a new string', () => {
    const str = '9';
    expect(convertToNumberOrUndefined(str)).not.toBe(str);
  });

  test('`convertToNumberOrUndefined` returns undefined for empty strings', () => {
    expect(convertToNumberOrUndefined('')).toBeUndefined();
  });

  test('`convertToNumberOrUndefined` works for positive integers', () => {
    expect(convertToNumberOrUndefined('90')).toBe(90);
    expect(convertToNumberOrUndefined('5')).toBe(5);
    expect(convertToNumberOrUndefined('0')).toBe(0);
  });

  test('`convertToNumberOrUndefined` works for negative integers', () => {
    expect(convertToNumberOrUndefined('-10')).toBe(-10);
    expect(convertToNumberOrUndefined('-600001')).toBe(-600001);
  });

  test('`convertToNumberOrUndefined` works for positive floats', () => {
    expect(convertToNumberOrUndefined('90.05')).toBe(90.05);
    expect(convertToNumberOrUndefined('100000.99')).toBe(100000.99);
    expect(convertToNumberOrUndefined('5.')).toBe(5.0);
  });

  test('`convertToNumberOrUndefined` works for negative floats', () => {
    expect(convertToNumberOrUndefined('-0.01')).toBe(-0.01);
    expect(convertToNumberOrUndefined('-10.91')).toBe(-10.91);
  });

  test('`convertToNumberOrUndefined` returns undefined for NaN', () => {
    expect(convertToNumberOrUndefined('bad number')).toBeUndefined();
    expect(convertToNumberOrUndefined('number.with.dots')).toBeUndefined();
    expect(
      convertToNumberOrUndefined('a whole sentence with no numbers'),
    ).toBeUndefined();
  });

  test('`convertToNumberOrUndefined` strips text out correctly', () => {
    expect(convertToNumberOrUndefined('12px')).toBe(12);
    expect(convertToNumberOrUndefined('-0.09.98')).toBe(-0.0998);
    expect(convertToNumberOrUndefined('word 788787')).toBe(788787);
    expect(convertToNumberOrUndefined('word 788787.9x9 word')).toBe(788787.99);
    expect(convertToNumberOrUndefined('$788,787.99')).toBe(788787.99);
    expect(convertToNumberOrUndefined('-9-908')).toBe(-9908);
  });

  test('`keywordSearch` returns true for empty inputs', () => {
    expect(keywordSearch('', '')).toBe(true);
    expect(keywordSearch([], [])).toBe(true);
    expect(keywordSearch('', 'asdsadasd')).toBe(true);
    expect(keywordSearch([], ['asda', 'vsdsd'])).toBe(true);
  });

  test('`keywordSearch` returns false if only 1 word matches in string', () => {
    expect(keywordSearch('my dfsdf', 'My Favorite Dashboard')).toBe(false);
  });

  test('`keywordSearch` returns false if only 1 word matches in array', () => {
    expect(
      keywordSearch(['my', 'dfsdf'], ['My', 'Favorite', 'Dashboard']),
    ).toBe(false);
  });

  test("`keywordSearch` returns false if multi word keyword doesn't match exactly", () => {
    expect(
      keywordSearch(['my favorite'], ['My', 'Favorite', 'Dashboard']),
    ).toBe(false);
  });

  test('`keywordSearch` returns true for case insensitive matching strings', () => {
    expect(keywordSearch('hea servi', 'Health Services')).toBe(true);
    expect(keywordSearch('my dash', 'My Favorite Dashboard')).toBe(true);
    expect(keywordSearch('My', 'My Favorite Dashboard')).toBe(true);
  });

  test('`keywordSearch` returns true for case insensitive matching arrays', () => {
    expect(keywordSearch(['hea', 'servi'], ['Health', 'Services'])).toBe(true);
    expect(keywordSearch(['my', 'dash'], ['My', 'Favorite', 'Dashboard'])).toBe(
      true,
    );
    expect(keywordSearch(['My'], ['My', 'Favorite', 'Dashboard'])).toBe(true);
  });

  test('`keywordSearch` returns true for case sensitive matching strings', () => {
    expect(
      keywordSearch(
        'Hea Servi',
        'Health Services',
        CASE_COMPARISON.CASE_SENSITIVE,
      ),
    ).toBe(true);
    expect(
      keywordSearch(
        'My Dash',
        'My Favorite Dashboard',
        CASE_COMPARISON.CASE_SENSITIVE,
      ),
    ).toBe(true);
    expect(
      keywordSearch(
        'My',
        'My Favorite Dashboard',
        CASE_COMPARISON.CASE_SENSITIVE,
      ),
    ).toBe(true);
  });

  test('`keywordSearch` returns false for case sensitive not matching strings', () => {
    expect(
      keywordSearch(
        'hea servi',
        'Health Services',
        CASE_COMPARISON.CASE_SENSITIVE,
      ),
    ).toBe(false);
    expect(
      keywordSearch(
        'my dash',
        'My Favorite Dashboard',
        CASE_COMPARISON.CASE_SENSITIVE,
      ),
    ).toBe(false);
    expect(
      keywordSearch(
        'My',
        'My Favorite Dashboard',
        CASE_COMPARISON.CASE_SENSITIVE,
      ),
    ).toBe(true);
  });

  test('`keywordSearch` returns true for case sensitive matching arrays', () => {
    expect(
      keywordSearch(
        ['Hea', 'Servi'],
        ['Health', 'Services'],
        CASE_COMPARISON.CASE_SENSITIVE,
      ),
    ).toBe(true);
    expect(
      keywordSearch(
        ['My', 'Dash'],
        ['My', 'Favorite', 'Dashboard'],
        CASE_COMPARISON.CASE_SENSITIVE,
      ),
    ).toBe(true);
    expect(
      keywordSearch(
        ['My'],
        ['My', 'Favorite', 'Dashboard'],
        CASE_COMPARISON.CASE_SENSITIVE,
      ),
    ).toBe(true);
  });

  test('`keywordSearch` returns false for case sensitive not matching arrays', () => {
    expect(
      keywordSearch(
        ['hea', 'servi'],
        ['Health', 'Services'],
        CASE_COMPARISON.CASE_SENSITIVE,
      ),
    ).toBe(false);
    expect(
      keywordSearch(
        ['my', 'dash'],
        ['My', 'Favorite', 'Dashboard'],
        CASE_COMPARISON.CASE_SENSITIVE,
      ),
    ).toBe(false);
  });

  test('`generateRandomString` returns length equal to argument', () => {
    expect(generateRandomString().length).toBe(10);
    expect(generateRandomString(0).length).toBe(0);
    expect(generateRandomString(1).length).toBe(1);
    expect(generateRandomString(5).length).toBe(5);
    expect(generateRandomString(20).length).toBe(20);
    expect(generateRandomString(500).length).toBe(500);
  });

  test('`generateRandomString` only contains expected characters', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateRandomString().match('[^0-9a-zA-Z]')).toBeNull();
    }
  });

  test('`generateRandomString` produces different results each time', () => {
    // NOTE(abby): theoretically could randomly fail, but odds = 62^10000
    expect(generateRandomString(10000)).not.toBe(generateRandomString(10000));
  });

  test('`getPixelValue` returns a new string', () => {
    const str = '9px';
    expect(getPixelValue(str)).not.toBe(str);
  });

  test('`getPixelValue` work for numbers with variety of digits', () => {
    expect(getPixelValue('12px')).toBe(12);
    expect(getPixelValue('0px')).toBe(0);
    expect(getPixelValue('1px')).toBe(1);
    expect(getPixelValue('999px')).toBe(999);
  });

  test('`getPixelValue` to be NaN with incorrect format', () => {
    expect(getPixelValue('asdas')).toBeNaN();
    expect(getPixelValue('a12px')).toBeNaN();
    expect(getPixelValue('12pxs')).toBeNaN();
  });
});
