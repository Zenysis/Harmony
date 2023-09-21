#!/usr/bin/env node
/**
 * This file is the main entry point for the translations generation script.
 * This file requires that it be called from the zenysis root directory.
 *
 * File paths passed in as arguments must be absolute.
 */
const generateTranslations = require('./generateTranslations');

const VERBOSE_FLAG = '--verbose';

function main() {
  const args = process.argv.slice(2).filter(Boolean);
  const useVerbose = args[0] === VERBOSE_FLAG;
  const filenames = useVerbose ? args.slice(1) : args;
  generateTranslations(filenames, useVerbose);
}

main();
