#!/usr/bin/env node
/**
 * This file is the main entry point for the script that adds a new locale.
 *
 */
const addLocale = require('./addLocale');

function main() {
  const scriptArgs = process.argv.slice(2).filter(Boolean);
  const [newLocale, ...i18nFilenames] = scriptArgs;

  addLocale(newLocale, i18nFilenames);
}

main();
