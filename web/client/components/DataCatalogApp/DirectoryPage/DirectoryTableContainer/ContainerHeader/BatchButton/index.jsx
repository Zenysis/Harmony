// @flow
import * as React from 'react';

import Icon from 'components/ui/Icon';
import type { IconType } from 'components/ui/Icon/types';

type Props = {
  onClick: () => void,
  iconType: IconType,
  text: string,

  buttonRef?: $ElementRefObject<'button'> | void,
};

export default function BatchButton({
  iconType,
  onClick,
  text,

  buttonRef = undefined,
}: Props): React.Element<'button'> {
  return (
    <button
      className="dc-batch-button"
      onClick={onClick}
      ref={buttonRef}
      type="button"
    >
      <Icon className="dc-batch-button__icon" type={iconType} />
      <div className="dc-batch-button__text">{text}</div>
    </button>
  );
}
