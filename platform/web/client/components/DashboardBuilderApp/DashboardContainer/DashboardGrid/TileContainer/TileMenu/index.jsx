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
import type { IconType } from 'components/ui/Icon/types';

export type MenuOption = {
  iconType: IconType,
  onClick: void | (() => void),
  text?: string,
};

type Props = {
  activateTileDownloads?: boolean,
  additionalMenuOptions?: $ReadOnlyArray<MenuOption>,
  legacy: boolean,
  onCloneItem: () => void,
  onDeleteItem: () => void,
  onEditItem: void | (() => void),
  onPlayItem: void | (() => void),
  presenting?: boolean,
  presentingModeMenuOptions?: $ReadOnlyArray<MenuOption>,
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
  activateTileDownloads = false,
  legacy,
  onCloneItem,
  onDeleteItem,
  onEditItem,
  onPlayItem,
  presenting = false,
  presentingModeMenuOptions = [],
  additionalMenuOptions = [],
}: Props) {
  const [menuOpen, openMenu, closeMenu] = useBoolean(false);

  // NOTE: We use the value of the dropdown option to pass the onClick
  // callback for that option. When an option is clicked we take it's value,
  // which is a function, and call it.
  const onDropdownOptionClick = valueAsOnOptionClick => {
    valueAsOnOptionClick();
  };

  // Default options for the legacy menu
  const defaultLegacyOptions = React.useMemo(
    () => [
      {
        iconType: 'remove',
        onClick: onDeleteItem,
        text: I18N.text('Delete'),
      },
      {
        iconType: 'edit',
        onClick: onEditItem,
        text: I18N.text('Edit'),
      },
    ],
    [onDeleteItem, onEditItem],
  );

  // NOTE: Both the legacy and modern versions of the menu are
  // required to support these menu options
  const commonTextOptions = React.useMemo(() => {
    const options = [
      {
        iconType: 'duplicate',
        onClick: onCloneItem,
        text: I18N.text('Clone'),
      },
      {
        iconType: 'play',
        onClick: onPlayItem,
        text: I18N.textById('Play'),
      },
      ...additionalMenuOptions,
    ];

    return options;
  }, [additionalMenuOptions, onCloneItem, onPlayItem]);

  // Default icon-only options for the modern menu
  const defaultIconOnlyOptions = React.useMemo(() => {
    if (presenting) {
      if (!activateTileDownloads) return [];
      return presentingModeMenuOptions;
    }

    // Return default icons menu if
    // we're not presenting
    return [
      {
        iconType: 'svg-edit-outline',
        onClick: onEditItem,
        text: I18N.textById('Edit'),
      },
      {
        iconType: 'svg-trash-can',
        onClick: onDeleteItem,
        text: I18N.text('Delete tile from dashboard'),
      },
    ];
  }, [
    presenting,
    onEditItem,
    onDeleteItem,
    activateTileDownloads,
    presentingModeMenuOptions,
  ]);

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
  // NOTE: This should only be used for non-legacy dashboards.
  // We can remove this note when legacy dashboards are deprecated.
  // TODO: IconButton component should have a props-based option to
  // render its own tooltip, but this will require a larger CSS refactor.
  const renderIconOnlyOption = (
    option: MenuOption,
  ): React.Element<typeof Tooltip> | null => {
    const { iconType, onClick } = option;
    if (legacy || onClick === undefined) {
      return null;
    }
    return (
      <Tooltip
        key={iconType}
        content={option.text}
        delayTooltip={250}
        tooltipPlacement="top"
      >
        <IconButton
          className="gd-dashboard-tile-menu__menu-item"
          onClick={onClick}
          testId={`gd-dashboard-tile-menu-${iconType}`}
          type={iconType}
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
          className="gd-dashboard-tile-menu__menu-item"
          onClick={openMenu}
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

        {/* show menu dropdown if not in presenting mode */}
        {!activateTileDownloads && renderDropdown([commonTextOptions])}
      </Group.Horizontal>
    );
  };

  const menuClassName = classNames('gd-dashboard-tile-menu', {
    'gd-dashboard-tile-menu--open': menuOpen,
    'gd-dashboard-tile-menu__legacy': legacy,
  });

  // only render menu if we have options to render
  if (defaultIconOnlyOptions.length === 0) return null;

  return (
    <div className={menuClassName}>
      {legacy ? renderLegacyMenu() : renderMenu()}
    </div>
  );
}

export default (React.memo(TileMenu): React.AbstractComponent<Props>);
