/**
 * Check if there are any duplicate ids among all translations, and
 * return which ones.
 *
 * @param {Array<TranslationGroup>} translationGroups An array of
 * TranslationGroup instances. Each group represents all translations
 * in a file.
 * @returns {Array<TranslationValidationError>} An array of objects with
 * a { message } string.
 */
function checkTranslationsForDuplicates(translationGroups) {
  const duplicateIds = new Set();
  const idToFilenames = {};
  const errors = [];

  // map all ids to the filenames they are in
  translationGroups.forEach(group => {
    const filename = group.getFilename();
    const translations = group.getTranslations();

    translations.forEach(record => {
      const id = record.getId();

      if (id in idToFilenames) {
        idToFilenames[id].add(filename);
        duplicateIds.add(id);
      } else {
        idToFilenames[id] = new Set([filename]);
      }
    });
  });

  // iterate through the duplicate ids and generate an error for each
  duplicateIds.forEach(id => {
    const filenames = [...idToFilenames[id]].join('\n- ');

    errors.push({
      message: `Duplicate i18n id found. '${id}' in files:\n- ${filenames}`,
    });
  });

  return errors;
}

module.exports = checkTranslationsForDuplicates;
