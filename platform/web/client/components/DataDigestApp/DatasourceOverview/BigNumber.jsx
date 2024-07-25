// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';

type Props = {
  subtitle: string,
  value: React.Node,
};

export default function BigNumber({ subtitle, value }: Props): React.Node {
  return (
    <Group.Vertical
      alignItems="center"
      className="dd-big-number"
      flex
      spacing="xxs"
    >
      <span className="dd-big-number__value">{value}</span>
      <Heading.Small>{subtitle}</Heading.Small>
    </Group.Vertical>
  );
}
