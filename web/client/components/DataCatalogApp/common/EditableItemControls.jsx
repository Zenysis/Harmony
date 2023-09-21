// @flow
import * as React from 'react';

import IconButton from 'components/ui/IconButton';
import Intents from 'components/ui/Intents';

type Props = {
  className?: string,
  editing: boolean,
  onCancelClick: () => void,
  onEditClick: () => void,
  onSubmitClick: () => void,
};

/**
 * A set of controls that enables a user to trigger editable states
 */
export default function EditableItemControls({
  className = '',
  editing,
  onCancelClick,
  onEditClick,
  onSubmitClick,
}: Props): React.Node {
  return (
    <div className={`editable-item-controls ${className}`}>
      {!editing && (
        <IconButton
          className="editable-item-controls__button"
          intent={Intents.PRIMARY}
          onClick={onEditClick}
          type="svg-edit-outline"
        />
      )}
      {editing && (
        <React.Fragment>
          <IconButton
            className="editable-item-controls__button"
            intent={Intents.DANGER}
            onClick={onCancelClick}
            type="svg-cancel-outline"
          />
          <div className="editable-item-controls__button-separator" />
          <IconButton
            className="editable-item-controls__button"
            intent={Intents.SUCCESS}
            onClick={onSubmitClick}
            type="svg-check-circle-outline"
          />
        </React.Fragment>
      )}
    </div>
  );
}
