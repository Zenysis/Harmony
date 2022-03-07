// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';

type Props = {
  value: React.Node,
  subtitle: string,
};

export default function BigNumber({ value, subtitle }: Props): React.Node {
  return (
    <Group.Vertical
      className="dd-big-number"
      flex
      alignItems="center"
      spacing="xxs"
    >
      <span className="dd-big-number__value">{value}</span>
      <Heading.Small>{subtitle}</Heading.Small>
    </Group.Vertical>
  );
}
