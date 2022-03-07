// @flow
import * as React from 'react';
import classNames from 'classnames';

import Caret from 'components/ui/Caret';
import EditableTabName from 'components/AdvancedQueryApp/QueryTabList/EditableTabName';
import I18N from 'lib/I18N';
import Popover from 'components/ui/Popover';
import QueryTabContextMenu from 'components/AdvancedQueryApp/QueryTabList/QueryTabContextMenu';
import useBoolean from 'lib/hooks/useBoolean';
import type QueryTabItem from 'models/AdvancedQueryApp/QueryTabItem';

type Props = {
  active: boolean,
  allTabNames: $ReadOnlySet<string>,
  disableDeletion: boolean,
  idx: number,
  item: QueryTabItem,
  onItemChange: (item: QueryTabItem, idx: number) => void,
  onItemClone: (item: QueryTabItem, idx: number) => void,
  onItemRemove: (idx: number) => void,
  onItemReset: (idx: number) => void,
  onTabActivate: (idx: number) => void,
  // scrolls the query tab list to the tab passed in.
  scrollToTab: (activeTab: HTMLDivElement) => void,
};

export default function QueryTab({
  active,
  allTabNames,
  disableDeletion,
  idx,
  item,
  onItemChange,
  onItemClone,
  onItemRemove,
  onItemReset,
  onTabActivate,
  scrollToTab,
}: Props): React.Element<'div'> {
  const tabItemRef = React.useRef();
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [showContextMenu, openContextMenu, closeContextMenu] = useBoolean(
    false,
  );

  const startRename = React.useCallback(() => {
    analytics.track('Rename AQT Tab');
    setIsRenaming(true);
  }, []);

  // scrolls to the tab to view if it is active.
  React.useEffect(() => {
    if (active && tabItemRef.current) {
      scrollToTab(tabItemRef.current);
    }
  }, [active, scrollToTab, tabItemRef]);

  const onTabClick = React.useCallback(() => {
    if (!active) {
      onTabActivate(idx);
    }
  }, [active, idx, onTabActivate]);

  const onClone = React.useCallback(() => {
    onItemClone(item, idx + 1);
    closeContextMenu();
  }, [idx, item, onItemClone, closeContextMenu]);

  const onContextMenuClick = React.useCallback(() => {
    openContextMenu();
  }, [openContextMenu]);

  const onDelete = React.useCallback(() => {
    onItemRemove(idx);
  }, [idx, onItemRemove]);

  const onReset = React.useCallback(() => {
    onItemReset(idx);
  }, [idx, onItemReset]);

  const onRenameComplete = React.useCallback(
    (newName: string) => {
      onItemChange(item.name(newName), idx);
      setIsRenaming(false);
    },
    [idx, item, onItemChange],
  );

  const isValidName = newName => {
    const nameIsUnique = newName === item.name() || !allTabNames.has(newName);
    if (!nameIsUnique) {
      return {
        isValid: nameIsUnique,
        rationale: I18N.text('A tab of the same name already exists'),
      };
    }
    return { isValid: nameIsUnique, rationale: '' };
  };

  const name = (
    <EditableTabName
      enableEditing={isRenaming}
      initialValue={item.name()}
      isValidName={isValidName}
      onRenameComplete={onRenameComplete}
      selectAllBeforeEditing
    />
  );

  const optionsButton = (
    <span>
      <Caret
        className="query-tab__context-button"
        onClick={onContextMenuClick}
        size={10}
      />
      <Popover
        className="query-tab__popover"
        anchorElt={tabItemRef.current}
        blurType={Popover.BlurTypes.DOCUMENT}
        isOpen={showContextMenu}
        anchorOuterSpacing={0}
      >
        <QueryTabContextMenu
          disableDeletion={disableDeletion}
          onCloneClick={onClone}
          onClose={closeContextMenu}
          onDeleteClick={onDelete}
          onRenameClick={startRename}
          onResetClick={onReset}
        />
      </Popover>
    </span>
  );

  const className = classNames('query-tab', {
    'query-tab--active': active,
    'query-tab--inactive': !active,
    'query-tab--editing': isRenaming,
  });

  const queryTabContentStyle = 'query-tab__content';

  return (
    <div
      ref={tabItemRef}
      className={className}
      onClick={onTabClick}
      role="button"
    >
      <div className={queryTabContentStyle}>
        {name}
        {optionsButton}
      </div>
    </div>
  );
}
