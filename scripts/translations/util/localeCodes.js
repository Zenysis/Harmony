const { readFile } = require('./io');
const { I18N_TEMPLATE_FILEPATH } = require('./config');

const LOCALE_REGEX = RegExp('^[a-z]{2}: {},$');

/**
 * Collects all ISO 3166-1 alpha-2 codes from the provided string.
 *
 * @param {string} templateContents string contents of file to search for
 * locales
 * @returns {Set<string>} All available ISO codes
 */
function collectLocaleCodesFromTemplate(templateContents) {
  const templateLines = templateContents.split(/\r?\n/);
  const localeCodes = new Set();
  templateLines.forEach(line => {
    const trimmedLine = line.trim();
    if (LOCALE_REGEX.test(trimmedLine)) {
      const localeCode = trimmedLine.slice(0, 2);
      localeCodes.add(localeCode);
    }
  });
  return localeCodes;
}

/**
 * Collects all ISO codes in the `i18n.js` template file, i.e. the
 * available locales on the platform.
 *
 * @returns {Promise<Set<string>>} All available ISO codes
 */
function collectLocaleCodes() {
  return readFile(I18N_TEMPLATE_FILEPATH).then(templateContents => {
    return collectLocaleCodesFromTemplate(templateContents);
  });
}

module.exports = { collectLocaleCodes, collectLocaleCodesFromTemplate };
