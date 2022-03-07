#!/usr/bin/env node

/**
 * This file is the entry point for the list_dangling_translations script.
 *
 * File paths passed in as arguments must be absolute.
 */
const listDanglingTranslations = require('./listDanglingTranslations');

function main() {
  const scriptArgs = process.argv.slice(2).filter(Boolean);
  const [baseLocale, ...i18nFilenames] = scriptArgs;

  listDanglingTranslations(baseLocale, i18nFilenames);
}

main();
