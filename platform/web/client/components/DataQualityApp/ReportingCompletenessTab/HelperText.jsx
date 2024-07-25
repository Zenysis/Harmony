// @flow
import * as React from 'react';

import Icon from 'components/ui/Icon';

type Props = {
  text: string,
};

export default function HelperText({ text }: Props): React.Node {
  return (
    <p className="dq-helper-text">
      <Icon type="info-sign" /> {text}
    </p>
  );
}
