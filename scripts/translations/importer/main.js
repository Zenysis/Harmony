#!/usr/bin/env node
/**
 * This file is the main entry point for the translations import script.
 *
 * File path passed in as argument must be an absolute path to a CSV.
 */
const importTranslations = require('./importTranslations');

function main() {
  const scriptArgs = process.argv.slice(2).filter(Boolean);
  const translatedLocale = scriptArgs[0];
  const filepath = scriptArgs[1];

  importTranslations(translatedLocale, filepath);
}

main();
