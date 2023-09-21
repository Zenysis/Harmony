#!/usr/bin/env node
/**
 * This file is the main entry point for the list_out_of_sync script.
 *
 * File paths passed in as arguments must be absolute.
 */
const listOutOfSync = require('./listOutOfSync');

function main() {
  const filenames = process.argv.slice(2).filter(Boolean);
  listOutOfSync(filenames);
}

main();
