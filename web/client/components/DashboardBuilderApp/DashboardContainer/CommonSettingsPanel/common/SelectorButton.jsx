//  @flow
import * as React from 'react';

import Icon from 'components/ui/Icon';

type Props = {
  title: string,
};

export default function SelectorButton({ title }: Props): React.Node {
  return (
    <button className="gd-query-section__selector-btn" type="button">
      <Icon type="filter" ariaHidden /> {title}
    </button>
  );
}
