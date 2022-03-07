#!/usr/bin/env node
/**
 * This file is the main entry point for the translations watch script.
 *
 * This script receives the files detected by the `watchman` service and calls
 * our translations generation script on all those files (with the exception
 * of any i18n.js files).
 *
 * Requirements:
 * - The first argument should be the path to use as the zenysis root
 * - All filepaths received must be relative to the zenysis root
 * - All filepaths must come in through stdin (this is what watchman-wait forces
 *   on us)
 */

const { I18N_FILENAME } = require('../util/config');
const generateTranslations = require('../generator/generateTranslations');
const readline = require('readline');

const I18N_LIBRARY_PATH = 'lib/I18N/index.jsx';

// amount of time to wait in between each newly received file
const DEBOUNCE_TIME_MS = 500;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

const VERBOSE_FLAG = '--verbose';

function main() {
  let timeoutId;
  const cliArgs = process.argv.slice(2);
  const projectRoot = cliArgs[0];
  const useVerbose = cliArgs[1] === VERBOSE_FLAG;
  const fileSet = new Set();

  // each received file is a line in stdin. After our debounce timeout
  // expires, we will call the `generateTranslations` function.
  rl.on('line', line => {
    // ignore processing any i18n.js files, and ignore processing the core
    // library
    if (line.endsWith(I18N_FILENAME) || line.endsWith(I18N_LIBRARY_PATH)) {
      return;
    }

    // batch lines into one array, until `DEBOUNCE_TIME_MS` has passed.
    // At that point our timeout is triggered and we generate translations.
    fileSet.add(line);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      // clear/clone necessary data
      timeoutId = undefined;
      const filepaths = [];
      fileSet.forEach(relativePath => {
        filepaths.push(`${projectRoot}/${relativePath}`);
      });
      fileSet.clear();

      // now we can generate all translations!
      generateTranslations(filepaths, useVerbose);
    }, DEBOUNCE_TIME_MS);
  });
}

main();
