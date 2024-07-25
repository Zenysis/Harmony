#!/usr/bin/env node

/**
 * This file is the entry point for the listDanglingReferences script.
 *
 * File paths passed in as arguments must be absolute.
 */
const listDanglingReferences = require('./listDanglingReferences');

function main() {
  const i18nFilenames = process.argv.slice(2).filter(Boolean);

  listDanglingReferences(i18nFilenames);
}

main();
