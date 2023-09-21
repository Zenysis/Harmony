// @flow
import * as React from 'react';

import Icon from 'components/ui/Icon';
import type { IconType } from 'components/ui/Icon/types';

type Props = {
  buttonRef?: $ElementRefObject<'button'> | void,
  iconType: IconType,
  onClick: () => void,
  text: string,
};

export default function BatchButton({
  iconType,
  onClick,
  text,

  buttonRef = undefined,
}: Props): React.Element<'button'> {
  return (
    <button
      ref={buttonRef}
      className="dc-batch-button"
      onClick={onClick}
      type="button"
    >
      <Icon className="dc-batch-button__icon" type={iconType} />
      <div className="dc-batch-button__text">{text}</div>
    </button>
  );
}
