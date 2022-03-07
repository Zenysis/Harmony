// @flow
import * as React from 'react';
import classNames from 'classnames';

import ChangeCategorySelector from 'components/DataCatalogApp/common/ChangeCategorySelector';
import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import IconButton from 'components/ui/IconButton';
import Popover from 'components/ui/Popover';
import Tooltip from 'components/ui/Tooltip';
import useBoolean from 'lib/hooks/useBoolean';
import { noop } from 'util/util';

type Props = {
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof ChangeCategorySelector>,
    'hierarchyRoot',
  >,
  id: string,

  onCategoryChange: $PropertyType<
    React.ElementConfig<typeof ChangeCategorySelector>,
    'onCategoryChange',
  >,
  onDeleteClick?: () => void,

  deleteOptionTooltip?: string,
};

function preventClickPropagate(event: SyntheticMouseEvent<>) {
  event.stopPropagation();
}

export default function DirectoryRowMenu({
  hierarchyRoot,
  id,
  onCategoryChange,

  deleteOptionTooltip = undefined,
  onDeleteClick = undefined,
}: Props): React.Element<'div'> {
  const [dropdownOpen, onDropdownOpen, onDropdownClose] = useBoolean(false);
  const [
    categoryOptionOpen,
    onOpenCategoryOption,
    onCloseCategoryOption,
  ] = useBoolean(false);
  const menuRef = React.useRef();

  const onParentCategoryChange = React.useCallback(
    (...args) => {
      onCategoryChange(...args);
      onCloseCategoryOption();
    },
    [onCategoryChange, onCloseCategoryOption],
  );

  const onMenuItemClick = React.useCallback(
    (value: 'move' | 'delete') => {
      if (value === 'move') {
        onOpenCategoryOption();
      } else if (value === 'delete') {
        onDeleteClick();
      }
    },
    [onOpenCategoryOption, onDeleteClick],
  );

  const className = classNames('dc-directory-row-menu', {
    'dc-directory-row-menu--open': dropdownOpen,
  });

  const buttonClassName = classNames('dc-directory-row-menu__dropdown-button', {
    'dc-directory-row-menu__dropdown-button--active': dropdownOpen,
  });
  const iconButton = (
    <IconButton
      className={buttonClassName}
      onClick={noop}
      type="svg-more-horiz"
    />
  );

  // Stop click events from propagating to the parent elements by attaching
  // `onClick` handler to the root div. This makes it so we don't need to attach
  // `event.stopPropagation` anywhere downstream from this component.
  // NOTE(stephen): Disabling role lint because the `onClick` handler is only
  // being used to prevent click events from propagating to the parent elements.
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className={className} ref={menuRef} onClick={preventClickPropagate}>
      <Dropdown
        buttonClassName="dc-directory-row-menu__dropdown-button-wrapper"
        defaultDisplayContent={iconButton}
        hideCaret
        onDropdownClose={onDropdownClose}
        onOpenDropdownClick={onDropdownOpen}
        onSelectionChange={onMenuItemClick}
        value={undefined}
      >
        <Dropdown.Option value="move">
          <I18N>Move to</I18N>
        </Dropdown.Option>

        <Dropdown.Option unselectable={!onDeleteClick} value="delete">
          <Tooltip content={deleteOptionTooltip} tooltipPlacement="top">
            <I18N.Ref id="Delete" />
          </Tooltip>
        </Dropdown.Option>
      </Dropdown>
      <Popover
        anchorElt={menuRef.current}
        anchorOrigin={Popover.Origins.TOP_RIGHT}
        containerType="none"
        doNotFlip
        isOpen={categoryOptionOpen}
        keepInWindow
        onRequestClose={onCloseCategoryOption}
        popoverOrigin={Popover.Origins.TOP_LEFT}
      >
        <ChangeCategorySelector
          applyButtonText={I18N.textById('moveToFolder')}
          hierarchyRoot={hierarchyRoot}
          id={id}
          onCategoryChange={onParentCategoryChange}
        />
      </Popover>
    </div>
  );
}
