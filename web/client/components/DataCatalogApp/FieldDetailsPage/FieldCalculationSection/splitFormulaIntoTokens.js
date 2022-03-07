// @flow

export type Token = {
  type: 'field' | 'characters',
  value: string,
};

type MatchResult = {
  matchValue: string | void,
  stringSinceLastMatch: string | void,
};

// Evaluate the regex pattern against the supplied value. Yield a MatchResult
// which contains the match value (if it exists) and the substring since the
// last match (if it exists).
// NOTE(stephen): I really wanted this to be a generator function! Babel
// required `regeneratorRuntime` to be added, though, which seemed like too much
// for our first generator function.
function findMatches(
  value: string,
  pattern: RegExp,
): $ReadOnlyArray<MatchResult> {
  const output = [];
  let lastIndex = 0;
  let loopCount = 0;
  let match = pattern.exec(value);
  while (match !== null) {
    // NOTE(stephen): Try to prevent infinite loops in case a bad regex is
    // passed in.
    if (loopCount >= 10000) {
      console.error('Infinite loop detected. Bad regex supplied: ', pattern);
      break;
    }

    const result = {
      matchValue: match[0],
      stringSinceLastMatch: undefined,
    };

    const stringSinceLastMatch = value.substring(lastIndex, match.index);
    if (stringSinceLastMatch.length > 0) {
      result.stringSinceLastMatch = stringSinceLastMatch;
    }
    output.push(result);

    loopCount += 1;
    lastIndex = match.index + result.matchValue.length;
    match = pattern.exec(value);
  }

  const stringSinceLastMatch = value.substring(lastIndex);
  if (stringSinceLastMatch.length > 0) {
    output.push({
      matchValue: undefined,
      stringSinceLastMatch,
    });
  }
  return output;
}

// Split the non-field characters into segments that should be displayed on
// their own. This is useful for making a formula string that has no spaces
// display in a more pleasing way. Consecutive characters like `((`` or `)/(`
// will be split (like ['(', ')']). Sections that should not be split (like
// numbers `100.23`) will be kept together.
function splitCharacterPieces(characters: string): $ReadOnlyArray<Token> {
  const pattern = /([^a-zA-Z0-9.]{2,})/g;
  const output = [];
  const matches = findMatches(characters, pattern);
  matches.forEach(({ matchValue, stringSinceLastMatch }) => {
    if (stringSinceLastMatch !== undefined) {
      output.push({ type: 'characters', value: stringSinceLastMatch });
    }
    if (matchValue !== undefined) {
      // Since we are matching a section of consecutive characters (non alpha
      // and non-numeric), we want to split each character into its own token.
      output.push(
        ...matchValue.split('').map(value => ({ type: 'characters', value })),
      );
    }
  });
  return output;
}

// Split the formula expression into different token strings. This will help
// us pretty-print.
export default function splitFormulaIntoTokens(
  expression: string,
): $ReadOnlyArray<Token> {
  // Replace all whitespace in the formula expression since we will be adding
  // it ourselves during rendering.
  const cleanExpression = expression.replace(/\s/g, '');
  // Regex pattern here supports both relay IDs and database field ID. There are
  // relay ids that end with '=' or '==' hence the '=' in the second group.
  const pattern = /\b([a-zA-Z_][a-zA-Z0-9_=]+)/g;
  const output = [];
  const matches = findMatches(cleanExpression, pattern);
  matches.forEach(({ matchValue, stringSinceLastMatch }) => {
    if (stringSinceLastMatch !== undefined) {
      output.push(...splitCharacterPieces(stringSinceLastMatch));
    }
    if (matchValue !== undefined) {
      output.push({ type: 'field', value: matchValue });
    }
  });
  return output;
}
