// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import TagItemList from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/common/TagItemList';
import { noop } from 'util/util';
import type { Identifiable } from 'types/interfaces/Identifiable';

type Props<T: Identifiable> = {
  renderTag: $PropertyType<
    React.ElementConfig<typeof TagItemList>,
    'renderTag',
  >,
  selectedItems: Zen.Array<T>,
  title: string,
};

export default function CollapsedLayoutList<T: Identifiable>({
  renderTag,
  selectedItems,
  title,
}: Props<T>): React.Node {
  if (selectedItems.isEmpty()) {
    return null;
  }

  return (
    <Group.Vertical
      spacing="xs"
      className="gd-query-section gd-query-section--collapsed-layout"
    >
      <Heading.Small>{title}</Heading.Small>
      <TagItemList
        onSelectedItemsChanged={noop}
        renderTag={renderTag}
        selectedItems={selectedItems}
      />
    </Group.Vertical>
  );
}
