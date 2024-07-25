// @flow
import * as React from 'react';

import TextHighlighter from 'components/ui/TextHighlighter';
import type StringMatcher from 'lib/StringMatcher';

type Props = {
  matcher: StringMatcher,
  text: string,
};

/**
 * Highlight the input text by finding matching substrings using the
 * `StringMatcher` provided.
 */
export default function MatchTextHighlighter({
  matcher,
  text,
}: Props): React.Element<typeof TextHighlighter> {
  return (
    <TextHighlighter
      highlightPositions={matcher.getMatchPositions(text)}
      text={text}
    />
  );
}
