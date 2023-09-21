/**
 * This class represents a collection of translations held in a single file.
 */
class TranslationGroup {
  /**
   * Takes an object of values to create the TranslationGroup
   * @param {string} filename The filename this translation group belongs to
   * @param {Array<TranslationRecord>} translations The translation records held in
   * this file.
   */
  static create({ filename, translations }) {
    return new TranslationGroup({ filename, translations });
  }

  constructor({ filename, translations }) {
    this.filename = filename;
    this.translations = translations;
  }

  getFilename() {
    return this.filename;
  }

  getTranslations() {
    return this.translations;
  }

  hasTranslations() {
    return this.translations.length > 0;
  }
}

module.exports = TranslationGroup;
