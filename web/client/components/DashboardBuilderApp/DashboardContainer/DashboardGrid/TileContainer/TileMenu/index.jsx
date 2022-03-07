// @flow
import * as React from 'react';
import classNames from 'classnames';

import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import IconButton from 'components/ui/IconButton';
import Tooltip from 'components/ui/Tooltip';
import useBoolean from 'lib/hooks/useBoolean';
import { ENABLE_FULL_SCREEN_PLAY_MODE } from 'components/DashboardBuilderApp/flags';
import type { IconType } from 'components/ui/Icon/types';

export type MenuOption = {
  onClick: void | (() => void),
  iconType: IconType,
  text?: string,
};

type Props = {
  legacy: boolean,
  onCloneItem: () => void,
  onDeleteItem: () => void,
  onEditItem: void | (() => void),
  onPlayItem: void | (() => void),

  additionalMenuOptions?: $ReadOnlyArray<MenuOption>,
};

const EDGE_THRESHOLDS = {
  bottom: -120,
  top: 120,
};

/**
 * The TileMenu renders a dropdown of options the user can choose for the tile.
 * By default, it renders clone, delete and edit options, assuming valid
 * callbacks are provided. Additional menu options can also be rendered using
 * the additionalMenuOptions prop.
 */
function TileMenu({
  legacy,
  onCloneItem,
  onDeleteItem,
  onEditItem,
  onPlayItem,
  additionalMenuOptions = [],
}: Props) {
  const [menuOpen, openMenu, closeMenu] = useBoolean(false);

  // NOTE(david): We use the value of the dropdown option to pass the onClick
  // callback for that option. When an option is clicked we take it's value,
  // which is a function, and call it.
  const onDropdownOptionClick = valueAsOnOptionClick => {
    valueAsOnOptionClick();
  };

  // Default options for the legacy menu
  const defaultLegacyOptions = React.useMemo(
    () => [
      {
        onClick: onDeleteItem,
        iconType: 'remove',
        text: I18N.text('Delete'),
      },
      {
        onClick: onEditItem,
        iconType: 'edit',
        text: I18N.text('Edit'),
      },
    ],
    [onDeleteItem, onEditItem],
  );

  // NOTE(moriah, nina): Both the legacy and modern versions of the menu are
  // required to support these menu options
  const commonTextOptions = React.useMemo(() => {
    const options = [
      {
        onClick: onCloneItem,
        iconType: 'duplicate',
        text: I18N.text('Clone'),
      },
      ...additionalMenuOptions,
    ];

    if (ENABLE_FULL_SCREEN_PLAY_MODE) {
      options.push({
        onClick: onPlayItem,
        iconType: 'play',
        text: I18N.textById('Play'),
      });
    }

    return options;
  }, [additionalMenuOptions, onCloneItem]);

  // Default icon-only options for the modern menu
  const defaultIconOnlyOptions = React.useMemo(
    () => [
      {
        onClick: onEditItem,
        iconType: 'svg-edit-outline',
        text: I18N.textById('Edit'),
      },
      {
        onClick: onDeleteItem,
        iconType: 'svg-trash-can',
        text: I18N.text('Delete tile from dashboard'),
      },
    ],
    [onDeleteItem, onEditItem],
  );

  const renderMenuOption = (
    option: MenuOption,
  ): React.Element<typeof Dropdown.Option> | null => {
    const { iconType, onClick, text } = option;

    // Don't render a menu option if we haven't been passed an onClick for that
    // option
    if (onClick === undefined || text === undefined) {
      return null;
    }

    return (
      <Dropdown.Option key={text} value={onClick}>
        <Group.Horizontal alignItems="center" flex>
          <Icon type={iconType} />
          {text}
        </Group.Horizontal>
      </Dropdown.Option>
    );
  };

  // Render a menu option that is only visible as an icon
  // NOTE(moriah, nina): This should only be used for non-legacy dashboards.
  // We can remove this note when legacy dashboards are deprecated.
  // TODO(isabel): IconButton component should have a props-based option to
  // render its own tooltip, but this will require a larger CSS refactor.
  // See Pablo's comment https://phab.zenysis.com/D3582?id=14388#inline-29552
  const renderIconOnlyOption = (
    option: MenuOption,
  ): React.Element<typeof Tooltip> | null => {
    const { onClick, iconType } = option;
    if (legacy || onClick === undefined) {
      return null;
    }
    return (
      <Tooltip
        content={option.text}
        delayTooltip={250}
        key={iconType}
        tooltipPlacement="top"
      >
        <IconButton
          onClick={onClick}
          className="gd-dashboard-tile-menu__menu-item"
          type={iconType}
          testId={`gd-dashboard-tile-menu-${iconType}`}
        />
      </Tooltip>
    );
  };

  const renderDropdown = (
    options: $ReadOnlyArray<$ReadOnlyArray<MenuOption>>,
  ) => {
    const menuOptions = options.reduce((accum, el) => accum.concat(el), []);
    const displayButton = legacy ? (
      <Icon type="option-horizontal" />
    ) : (
      <Tooltip
        content={I18N.text('More options')}
        delayTooltip={250}
        tooltipPlacement="top"
      >
        <IconButton
          onClick={openMenu}
          className="gd-dashboard-tile-menu__menu-item"
          type="svg-more-horiz"
        />
      </Tooltip>
    );
    return (
      <Dropdown
        buttonClassName="gd-dashboard-tile-menu__dropdown-button"
        defaultDisplayContent={displayButton}
        hideCaret
        onDropdownClose={closeMenu}
        onOpenDropdownClick={openMenu}
        onSelectionChange={onDropdownOptionClick}
        testId="settings-button"
        value={undefined}
        windowEdgeThresholds={EDGE_THRESHOLDS}
      >
        {menuOptions.map(renderMenuOption)}
      </Dropdown>
    );
  };

  const renderLegacyMenu = () => {
    return renderDropdown([defaultLegacyOptions, commonTextOptions]);
  };

  // Render the default modern options, as well as any additional text options
  const renderMenu = () => {
    return (
      <Group.Horizontal alignItems="center" spacing="xxxs">
        {defaultIconOnlyOptions.map(renderIconOnlyOption)}
        {renderDropdown([commonTextOptions])}
      </Group.Horizontal>
    );
  };

  const menuClassName = classNames('gd-dashboard-tile-menu', {
    'gd-dashboard-tile-menu__legacy': legacy,
    'gd-dashboard-tile-menu--open': menuOpen,
  });

  return (
    <div className={menuClassName}>
      {legacy ? renderLegacyMenu() : renderMenu()}
    </div>
  );
}

export default (React.memo(TileMenu): React.AbstractComponent<Props>);
