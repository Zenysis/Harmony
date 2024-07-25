/**
 * Simple terminal text coloration utility containing:
 * - A way to color a text string that will be printed to the terminal
 * - A mapping from a human readable name to the the terminal's ANSI color code
 *   character sequence.
 */

const RESET = '\x1b[0m';

const LogColor = {
  BRIGHT: '\x1b[1m',
  DIM: '\x1b[2m',
  UNDERSCORE: '\x1b[4m',
  BLINK: '\x1b[5m',
  REVERSE: '\x1b[7m',
  HIDDEN: '\x1b[8m',
  BLACK: '\x1b[30m',
  RED: '\x1b[91m',
  GREEN: '\x1b[92m',
  YELLOW: '\x1b[93m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[96m',
  WHITE: '\x1b[37m',
  CRIMSON: '\x1b[38m',
  BG_BLACK: '\x1b[40m',
  BG_RED: '\x1b[41m',
  BG_GREEN: '\x1b[42m',
  BG_YELLOW: '\x1b[43m',
  BG_BLUE: '\x1b[44m',
  BG_MAGENTA: '\x1b[45m',
  BG_CYAN: '\x1b[46m',
  BG_WHITE: '\x1b[47m',
  BG_CRIMSON: '\x1b[48m',

  text(str, ...colors) {
    const colorPrefix = colors.join('');
    return `${colorPrefix}${str}${RESET}`;
  },

  print(str, ...colors) {
    console.log(LogColor.text(str, ...colors));
  },
};

module.exports = LogColor;
