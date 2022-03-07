// @flow
import * as React from 'react';

import DashboardControlButton from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/DashboardControlButton';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import useCanViewQueryForm from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TileMenu/QueryTileMenu/useCanViewQueryForm';
import { noop } from 'util/util';
import type { PlaceholderItemType } from 'models/DashboardBuilderApp/DashboardItem/DashboardPlaceholderItem';

type Props = {
  enableSpacers: boolean,
  onAddTile: (PlaceholderItemType | 'spacer') => void,
};

/**
 * The AddTileButton allows the user to add a new placeholder or spacer tile to
 * the bottom of the dashboard.
 */
export default function AddTileButton({
  enableSpacers,
  onAddTile,
}: Props): React.Node {
  const canViewQueryForm = useCanViewQueryForm();

  const dropdownOptions = React.useMemo(() => {
    const options = [
      {
        iconType: 'svg-text',
        title: I18N.text('Add Text'),
        value: 'text_item',
      },
    ];

    if (canViewQueryForm) {
      options.push({
        iconType: 'svg-chart',
        title: I18N.text('Add Visualization'),
        value: 'query',
      });
    }

    options.push({
      iconType: 'svg-iframe',
      title: I18N.text('Embed iFrame'),
      value: 'iframe',
    });

    if (enableSpacers) {
      options.push({
        iconType: 'svg-add',
        title: I18N.text('Add Spacer'),
        value: 'spacer',
      });
    }

    options.push({
      iconType: 'svg-horizontal-split',
      title: I18N.text('Add Divider'),
      value: 'divider',
    });

    return options;
  }, [canViewQueryForm]);

  const dropdownButton = (
    <DashboardControlButton
      iconType="svg-add"
      onClick={noop}
      title={I18N.text('Add Content')}
    />
  );
  return (
    <Dropdown
      buttonClassName="gd-dashboard-controls-dropdown-button"
      defaultDisplayContent={dropdownButton}
      hideCaret
      onSelectionChange={onAddTile}
      value={undefined}
    >
      {dropdownOptions.map(({ iconType, title, value }) => (
        <Dropdown.Option key={value} value={value}>
          <Group.Horizontal alignItems="center" flex>
            <Icon type={iconType} />
            <div>{title}</div>
          </Group.Horizontal>
        </Dropdown.Option>
      ))}
    </Dropdown>
  );
}
