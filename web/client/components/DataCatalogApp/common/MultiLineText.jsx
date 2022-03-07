// @flow
import * as React from 'react';

type Props = {
  text: string,
};

function MultiLineText({ text }: Props): React.Node {
  // TODO(stephen, solo): We should probably make this more robust. Right now it
  // expects only newlines to be in the string. For some reason, it looks like
  // ZA uses carriage returns...so I'm trimming the value to get rid of them.
  return text.split('\n').map((line, idx) => {
    const key = `${line}-${idx}`;
    return (
      <React.Fragment key={key}>
        {idx > 0 && <br />}
        {line.trimEnd()}
      </React.Fragment>
    );
  });
}

export default (React.memo<Props>(
  MultiLineText,
): React.AbstractComponent<Props>);
