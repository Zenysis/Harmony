// @flow
import * as React from 'react';
import classNames from 'classnames';

import Checkbox from 'components/ui/Checkbox';
import DirectoryRowMenu from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/DirectoryTable/DirectoryRow/DirectoryRowMenu';
import EditableItemControls from 'components/DataCatalogApp/common/EditableItemControls';
import EditableTextInput from 'components/DataCatalogApp/common/EditableTextInput';
import EditableVisibilityStatusDropdownInput from 'components/DataCatalogApp/common/EditableVisibilityStatusDropdownInput';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Toaster from 'components/ui/Toaster';
import type { VisibilityStatus } from 'models/core/DataCatalog/constants';

type Props = {
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof DirectoryRowMenu>,
    'hierarchyRoot',
  >,
  id: string,
  name: string,
  onCategoryChange: (
    id: string,
    onSuccess: () => void,
    onError: (Error) => void,
  ) => void,
  onClick: () => void,
  onSelect: () => void,
  onValueChange: ({
    description: string | void,
    name: string,
    visibilityStatus: VisibilityStatus,
  }) => void,
  selected: boolean,
  type: 'category' | 'field',
  visibilityStatus: VisibilityStatus,

  dataSources?: $ReadOnlyArray<{ +id: string, +name: string }>,
  description?: string | void,
  deleteOptionTooltip?: string,
  onDeleteClick?: () => void,
};

function renderIcon(type: 'category' | 'field'): React.Node {
  return (
    <div className={`dc-directory-row__icon dc-directory-row__icon--${type}`}>
      <Icon type={type === 'category' ? 'svg-folder' : 'svg-hashtag'} />
    </div>
  );
}

// The `DirectoryRow` component is the generalized row that will be rendered.
// The columns are specified as props, and any mutations should be handled by
// the user.
export default function DirectoryRow({
  hierarchyRoot,
  id,
  name,
  onCategoryChange,
  onClick,
  onSelect,
  onValueChange,
  selected,
  type,
  visibilityStatus,

  dataSources = [],
  description = undefined,
  deleteOptionTooltip = undefined,
  onDeleteClick = undefined,
}: Props): React.Element<'div'> {
  const [editing, setEditing] = React.useState(false);
  const currentNameValueRef = React.useRef(name);
  const currentDescriptionValueRef = React.useRef(description);
  const currentVisibilityStatusValueRef = React.useRef(visibilityStatus);

  // Need to track the interactive elements as refs so that we don't trigger the
  // onClick handler if one of them is clicked first.
  const selectBoxRef = React.useRef<?HTMLDivElement>(null);
  const controlsRef = React.useRef<?HTMLDivElement>(null);

  const onNewCategorySelected = React.useCallback(
    (categoryId: string, categoryName: string) => {
      onCategoryChange(
        categoryId,
        () =>
          Toaster.success(
            I18N.text('%(name)s has been moved to %(categoryName)s', {
              name,
              categoryName,
            }),
          ),
        (error: Error) => Toaster.error(error.message),
      );
    },
    [name, onCategoryChange],
  );

  const onRowClick = React.useCallback(
    ({ target }: SyntheticMouseEvent<>) => {
      if (editing || !(target instanceof HTMLElement)) {
        return;
      }

      // If the user is clicking on the checkbox, do not trigger the `onClick`
      // handler and let the checkbox's onClick handler take over.
      if (selectBoxRef.current && selectBoxRef.current.contains(target)) {
        return;
      }

      // If the user is clicking on the interactive controls, we also do not
      // want to trigger the `onClick` event.
      if (controlsRef.current && controlsRef.current.contains(target)) {
        return;
      }

      onClick();
    },
    [editing, onClick],
  );

  const onCancelClick = React.useCallback(() => {
    currentNameValueRef.current = name;
    currentDescriptionValueRef.current = description;
    currentVisibilityStatusValueRef.current = visibilityStatus;
    setEditing(false);
  }, [description, name, visibilityStatus]);

  const onSubmitClick = React.useCallback(() => {
    onValueChange({
      description: currentDescriptionValueRef.current,
      visibilityStatus: currentVisibilityStatusValueRef.current,
      name: currentNameValueRef.current,
    });
    setEditing(false);
  }, [onValueChange]);

  const className = classNames('dc-directory-row', {
    'dc-directory-row--editing': editing,
    'dc-directory-row--selected': selected,
  });
  return (
    <div className={className} onClick={onRowClick} role="row">
      <div
        className="dc-directory-row__select-box"
        ref={selectBoxRef}
        role="cell"
      >
        <Checkbox onChange={onSelect} value={selected} />
      </div>
      <div className="dc-directory-row__name" role="cell">
        {renderIcon(type)}
        <EditableTextInput
          currentValueRef={currentNameValueRef}
          editing={editing}
          initialValue={name}
        />
      </div>
      <div className="dc-directory-row__description" role="cell">
        {description !== undefined && (
          <EditableTextInput
            currentValueRef={currentDescriptionValueRef}
            editing={editing}
            initialValue={description}
            multiline
          />
        )}
      </div>
      <div className="dc-directory-row__datasources" role="cell">
        {dataSources.map(source => (
          <div key={source.id}>{source.name}</div>
        ))}
      </div>
      <div className="dc-directory-row__item-status" role="cell">
        {visibilityStatus !== undefined && (
          <EditableVisibilityStatusDropdownInput
            currentValueRef={currentVisibilityStatusValueRef}
            editing={editing}
            initialValue={visibilityStatus}
          />
        )}
      </div>
      <div className="dc-directory-row__controls" ref={controlsRef} role="cell">
        <EditableItemControls
          editing={editing}
          onEditClick={() => setEditing(true)}
          onCancelClick={onCancelClick}
          onSubmitClick={onSubmitClick}
        />
        {!editing && (
          <DirectoryRowMenu
            deleteOptionTooltip={deleteOptionTooltip}
            hierarchyRoot={hierarchyRoot}
            id={id}
            onCategoryChange={onNewCategorySelected}
            onDeleteClick={onDeleteClick}
          />
        )}
      </div>
    </div>
  );
}
