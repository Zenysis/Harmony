/**
 * This class represents a single translation record in an i18n.js file.
 */
class TranslationRecord {
  /**
   * Takes an object of values to create the TranslationRecord
   * @param {string} id The translation id
   * @param {string | PluralTranslationObject} value Translation text string
   * or an object with `zero`, `one`, and `other` keys to pluralize text
   * @param {?boolean} outOfSync True if this translation may be out of sync
   */
  static create({ id, value }, outOfSync = false) {
    return new TranslationRecord({ id, outOfSync, value });
  }

  constructor({ id, outOfSync, value }) {
    this.id = id;
    this.value = value;
    this.outOfSync = outOfSync;
  }

  getId() {
    return this.id;
  }

  getValue() {
    return this.value;
  }

  isOutOfSync() {
    return this.outOfSync;
  }
}

module.exports = TranslationRecord;
