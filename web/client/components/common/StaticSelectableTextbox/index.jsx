// @flow
import * as React from 'react';

import InputText from 'components/ui/InputText';
import { noop } from 'util/util';

type Props = {
  text: string,
};

export default function StaticSelectableTextbox({ text }: Props): React.Node {
  const onTextboxClick = e => {
    // It highlights the text content of an input box for a user to easily copy it.
    e.currentTarget.focus();
    e.currentTarget.select();
  };
  return (
    <InputText
      value={text}
      onChange={noop}
      onClick={onTextboxClick}
      width="100%"
    />
  );
}
