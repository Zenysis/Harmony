#!/usr/bin/env node
/**
 * This file is the main entry point for the translations export script.
 * This file requires that it be called from the zenysis root directory.
 *
 * File paths passed in as arguments must be absolute, except for the
 * outputCSVFile argument which is allowed to be relative.
 */
const exportTranslations = require('./exportTranslations');

// NOTE(isabel): Argument parsing is handled manually. If it gets more
// complicated than these two flags, use an arg parsing library like yargs.
const MISSING_FLAG = '--missing';
const OUT_OF_SYNC_FLAG = '--out_of_sync';

function main() {
  const scriptArgs = process.argv.slice(2).filter(Boolean);

  const flagArgs = [];
  const nonFlagArgs = [];
  scriptArgs.forEach(arg => {
    if (arg.startsWith('--')) {
      flagArgs.push(arg);
    } else {
      nonFlagArgs.push(arg);
    }
  });

  const [targetLocale, outputCSVFile, ...i18nFilenames] = nonFlagArgs;
  exportTranslations(
    targetLocale,
    outputCSVFile,
    i18nFilenames,
    flagArgs.includes(MISSING_FLAG),
    flagArgs.includes(OUT_OF_SYNC_FLAG),
  );
}

main();
